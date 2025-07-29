#!/bin/bash
# Update all cache busting timestamps in index.html

TIMESTAMP=$(date +%s)000
echo "Updating cache busting timestamps to: $TIMESTAMP"

# Update all script src tags with old timestamps
sed -i "s/v=1752683265404/v=$TIMESTAMP/g" mockup/index.html
sed -i "s/v=1753708925829/v=$TIMESTAMP/g" mockup/index.html

# Update scripts without timestamps
sed -i 's|<script src="js/performance-monitor.js"></script>|<script src="js/performance-monitor.js?v='$TIMESTAMP'"></script>|g' mockup/index.html
sed -i 's|<script src="js/remove-header-elements.js"></script>|<script src="js/remove-header-elements.js?v='$TIMESTAMP'"></script>|g' mockup/index.html
sed -i 's|<script src="js/aggressive-header-cleaner.js"></script>|<script src="js/aggressive-header-cleaner.js?v='$TIMESTAMP'"></script>|g' mockup/index.html
sed -i 's|<script src="js/pwa-handler.js"></script>|<script src="js/pwa-handler.js?v='$TIMESTAMP'"></script>|g' mockup/index.html
sed -i 's|<script src="js/social-feed-offline.js"></script>|<script src="js/social-feed-offline.js?v='$TIMESTAMP'"></script>|g' mockup/index.html

echo "✅ Cache busting timestamps updated"
echo "Total updates made:"
grep -c "v=$TIMESTAMP" mockup/index.html