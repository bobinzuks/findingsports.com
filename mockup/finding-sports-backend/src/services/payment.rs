use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use stripe::{
    Client, CreateCustomer, CreatePaymentIntent, CreatePrice, CreateProduct,
    CreateSubscription, Currency, Customer, PaymentIntent, Price, Product,
    Subscription, UpdateSubscription,
};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionPlan {
    pub id: String,
    pub name: String,
    pub description: String,
    pub price_cents: i64,
    pub interval: PlanInterval,
    pub features: Vec<String>,
    pub tier: SubscriptionTier,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum SubscriptionTier {
    Free,
    Pro,
    Elite,
    VenuePremium,
    VenueEnterprise,
    Corporate,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum PlanInterval {
    Monthly,
    Yearly,
}

pub struct PaymentService {
    stripe_client: Client,
    plans: Vec<SubscriptionPlan>,
}

impl PaymentService {
    pub fn new(stripe_secret_key: String) -> Self {
        let stripe_client = Client::new(stripe_secret_key);
        let plans = Self::initialize_plans();
        
        Self {
            stripe_client,
            plans,
        }
    }

    fn initialize_plans() -> Vec<SubscriptionPlan> {
        vec![
            // Consumer Plans
            SubscriptionPlan {
                id: "pro_monthly".to_string(),
                name: "Pro Monthly".to_string(),
                description: "Unlimited games, advanced features".to_string(),
                price_cents: 999,
                interval: PlanInterval::Monthly,
                features: vec![
                    "Unlimited game views".to_string(),
                    "Advanced filters & alerts".to_string(),
                    "Priority game joining".to_string(),
                    "Game history & stats".to_string(),
                    "No ads".to_string(),
                ],
                tier: SubscriptionTier::Pro,
            },
            SubscriptionPlan {
                id: "pro_yearly".to_string(),
                name: "Pro Yearly".to_string(),
                description: "Save 33% with annual billing".to_string(),
                price_cents: 7900,
                interval: PlanInterval::Yearly,
                features: vec!["All Pro features".to_string(), "2 months free".to_string()],
                tier: SubscriptionTier::Pro,
            },
            SubscriptionPlan {
                id: "elite_monthly".to_string(),
                name: "Elite Monthly".to_string(),
                description: "Premium features for serious athletes".to_string(),
                price_cents: 1999,
                interval: PlanInterval::Monthly,
                features: vec![
                    "Everything in Pro".to_string(),
                    "AI game recommendations".to_string(),
                    "Reserve spots in advance".to_string(),
                    "Create private games".to_string(),
                    "Team management tools".to_string(),
                    "Exclusive venues access".to_string(),
                ],
                tier: SubscriptionTier::Elite,
            },
            // Venue Plans
            SubscriptionPlan {
                id: "venue_premium".to_string(),
                name: "Premium Venue".to_string(),
                description: "Featured venue listing with analytics".to_string(),
                price_cents: 9900,
                interval: PlanInterval::Monthly,
                features: vec![
                    "Featured placement".to_string(),
                    "Advanced analytics".to_string(),
                    "Booking management".to_string(),
                    "Custom branding".to_string(),
                    "API access".to_string(),
                ],
                tier: SubscriptionTier::VenuePremium,
            },
            // Corporate Plans
            SubscriptionPlan {
                id: "corporate_small".to_string(),
                name: "Corporate Wellness - Small".to_string(),
                description: "For companies under 50 employees".to_string(),
                price_cents: 19900,
                interval: PlanInterval::Monthly,
                features: vec![
                    "Employee sports coordination".to_string(),
                    "Team building events".to_string(),
                    "Usage analytics".to_string(),
                    "Health tracking integration".to_string(),
                ],
                tier: SubscriptionTier::Corporate,
            },
        ]
    }

    pub async fn create_customer(
        &self,
        user_id: Uuid,
        email: &str,
        name: Option<&str>,
    ) -> Result<String> {
        let mut params = CreateCustomer::new();
        params.email = Some(email);
        params.name = name;
        params.metadata = Some(
            [("user_id".to_string(), user_id.to_string())]
                .iter()
                .cloned()
                .collect(),
        );

        let customer = Customer::create(&self.stripe_client, params).await?;
        Ok(customer.id.to_string())
    }

    pub async fn create_subscription(
        &self,
        customer_id: &str,
        plan_id: &str,
        trial_days: Option<u32>,
    ) -> Result<SubscriptionInfo> {
        let plan = self
            .plans
            .iter()
            .find(|p| p.id == plan_id)
            .ok_or_else(|| anyhow::anyhow!("Invalid plan ID"))?;

        // Create or get Stripe product
        let product = self.ensure_stripe_product(&plan).await?;
        let price = self.ensure_stripe_price(&product.id, &plan).await?;

        // Create subscription
        let mut params = CreateSubscription::new(customer_id.into());
        params.items = Some(vec![stripe::CreateSubscriptionItems {
            price: Some(price.id.to_string()),
            quantity: Some(1),
            ..Default::default()
        }]);

        if let Some(trial) = trial_days {
            params.trial_period_days = Some(trial);
        }

        // Add metadata
        params.metadata = Some(
            [
                ("plan_id".to_string(), plan_id.to_string()),
                ("tier".to_string(), format!("{:?}", plan.tier)),
            ]
            .iter()
            .cloned()
            .collect(),
        );

        let subscription = Subscription::create(&self.stripe_client, params).await?;

        Ok(SubscriptionInfo {
            id: subscription.id.to_string(),
            status: subscription.status.to_string(),
            current_period_end: subscription.current_period_end,
            plan_id: plan_id.to_string(),
            tier: plan.tier,
        })
    }

    pub async fn cancel_subscription(
        &self,
        subscription_id: &str,
        at_period_end: bool,
    ) -> Result<()> {
        let mut params = UpdateSubscription::new();
        
        if at_period_end {
            params.cancel_at_period_end = Some(true);
        } else {
            params.cancel_at = Some(Some(Utc::now().timestamp()));
        }

        Subscription::update(
            &self.stripe_client,
            &subscription_id.parse()?,
            params,
        )
        .await?;

        Ok(())
    }

    pub async fn create_payment_intent(
        &self,
        amount_cents: i64,
        currency: Currency,
        metadata: Option<std::collections::HashMap<String, String>>,
    ) -> Result<String> {
        let mut params = CreatePaymentIntent::new(amount_cents, currency);
        params.metadata = metadata;

        let intent = PaymentIntent::create(&self.stripe_client, params).await?;
        Ok(intent.client_secret.unwrap_or_default())
    }

    pub async fn process_venue_booking_fee(
        &self,
        booking_amount_cents: i64,
        venue_id: Uuid,
        user_id: Uuid,
    ) -> Result<BookingFeeResult> {
        let platform_fee = (booking_amount_cents as f64 * 0.05) as i64; // 5% fee
        
        let metadata = [
            ("type".to_string(), "booking_fee".to_string()),
            ("venue_id".to_string(), venue_id.to_string()),
            ("user_id".to_string(), user_id.to_string()),
            ("platform_fee".to_string(), platform_fee.to_string()),
        ]
        .iter()
        .cloned()
        .collect();

        let client_secret = self
            .create_payment_intent(platform_fee, Currency::USD, Some(metadata))
            .await?;

        Ok(BookingFeeResult {
            platform_fee_cents: platform_fee,
            venue_payout_cents: booking_amount_cents - platform_fee,
            payment_intent_secret: client_secret,
        })
    }

    async fn ensure_stripe_product(&self, plan: &SubscriptionPlan) -> Result<Product> {
        let mut params = CreateProduct::new(&plan.name);
        params.description = Some(&plan.description);
        params.metadata = Some(
            [("plan_id".to_string(), plan.id.clone())]
                .iter()
                .cloned()
                .collect(),
        );

        Ok(Product::create(&self.stripe_client, params).await?)
    }

    async fn ensure_stripe_price(
        &self,
        product_id: &str,
        plan: &SubscriptionPlan,
    ) -> Result<Price> {
        let mut params = CreatePrice::new(Currency::USD);
        params.product = Some(product_id.into());
        params.unit_amount = Some(plan.price_cents);
        params.recurring = Some(stripe::CreatePriceRecurring {
            interval: match plan.interval {
                PlanInterval::Monthly => stripe::CreatePriceRecurringInterval::Month,
                PlanInterval::Yearly => stripe::CreatePriceRecurringInterval::Year,
            },
            ..Default::default()
        });

        Ok(Price::create(&self.stripe_client, params).await?)
    }

    pub fn calculate_mrr(&self, subscriptions: &[SubscriptionInfo]) -> i64 {
        subscriptions
            .iter()
            .filter(|s| s.status == "active" || s.status == "trialing")
            .map(|s| {
                self.plans
                    .iter()
                    .find(|p| p.id == s.plan_id)
                    .map(|p| match p.interval {
                        PlanInterval::Monthly => p.price_cents,
                        PlanInterval::Yearly => p.price_cents / 12,
                    })
                    .unwrap_or(0)
            })
            .sum()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionInfo {
    pub id: String,
    pub status: String,
    pub current_period_end: i64,
    pub plan_id: String,
    pub tier: SubscriptionTier,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookingFeeResult {
    pub platform_fee_cents: i64,
    pub venue_payout_cents: i64,
    pub payment_intent_secret: String,
}

// Sport Coins virtual currency system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SportCoinsTransaction {
    pub id: Uuid,
    pub user_id: Uuid,
    pub amount: i32,
    pub transaction_type: CoinTransactionType,
    pub description: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CoinTransactionType {
    Purchase,
    Spend,
    Earn,
    Refund,
}

pub struct SportCoinsService {
    rates: std::collections::HashMap<i32, i64>, // coins -> price in cents
}

impl SportCoinsService {
    pub fn new() -> Self {
        let mut rates = std::collections::HashMap::new();
        rates.insert(100, 99);      // $0.99
        rates.insert(500, 499);     // $4.99
        rates.insert(1000, 999);    // $9.99
        rates.insert(5000, 3999);   // $39.99
        
        Self { rates }
    }

    pub fn get_coin_packages(&self) -> Vec<CoinPackage> {
        self.rates
            .iter()
            .map(|(coins, price)| CoinPackage {
                coins: *coins,
                price_cents: *price,
                bonus_coins: self.calculate_bonus(*coins),
            })
            .collect()
    }

    fn calculate_bonus(&self, coins: i32) -> i32 {
        match coins {
            100 => 0,
            500 => 50,    // 10% bonus
            1000 => 150,  // 15% bonus
            5000 => 1000, // 20% bonus
            _ => 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoinPackage {
    pub coins: i32,
    pub price_cents: i64,
    pub bonus_coins: i32,
}