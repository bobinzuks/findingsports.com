# Data Flow Diagrams - Sports Scraping System

## Overview

This document provides detailed data flow diagrams showing how data moves through the sports scraping system, from source discovery to real-time user updates.

## 1. High-Level Data Flow

```mermaid
graph TB
    A[Data Sources] --> B[Source Adapters]
    B --> C[Raw Data Queue]
    C --> D[Data Validation]
    D --> E[Data Processing Pipeline]
    E --> F[Processed Data Queue]
    F --> G[Data Storage]
    G --> H[Cache Layer]
    H --> I[API Gateway]
    I --> J[Client Applications]
    
    E --> K[Real-time Event Bus]
    K --> L[WebSocket Gateway]
    L --> M[Connected Clients]
    
    G --> N[Analytics Pipeline]
    N --> O[Metrics Store]
    O --> P[Monitoring Dashboard]
    
    style A fill:#e1f5fe
    style G fill:#f3e5f5
    style K fill:#fff3e0
    style M fill:#e8f5e8
```

## 2. Detailed Source Processing Flow

### 2.1 Source Discovery and Scheduling

```mermaid
sequenceDiagram
    participant Scheduler as Job Scheduler
    participant SM as Source Manager
    participant DB as Database
    participant Queue as Job Queue
    participant Worker as Scraping Worker
    
    Scheduler->>SM: Check scheduled sources
    SM->>DB: Query active sources
    DB-->>SM: Return source list
    SM->>SM: Calculate next run times
    SM->>Queue: Enqueue scraping jobs
    Queue-->>Worker: Dispatch job
    Worker->>Worker: Execute scraping
    Worker->>SM: Report job completion
    SM->>DB: Update source metadata
```

### 2.2 Data Scraping Process

```mermaid
graph TB
    A[Scraping Job] --> B{Source Type?}
    B -->|Website| C[HTTP Scraper]
    B -->|API| D[API Client]
    B -->|Feed| E[RSS/XML Parser]
    B -->|WebSocket| F[WebSocket Client]
    
    C --> G[HTML Parser]
    D --> H[JSON Processor]
    E --> I[Feed Parser]
    F --> J[Real-time Handler]
    
    G --> K[Data Extractor]
    H --> K
    I --> K
    J --> K
    
    K --> L[Raw Data Validation]
    L --> M{Valid?}
    M -->|Yes| N[Raw Data Queue]
    M -->|No| O[Error Handler]
    
    O --> P[Retry Logic]
    P --> Q{Retry?}
    Q -->|Yes| B
    Q -->|No| R[Dead Letter Queue]
    
    N --> S[Data Processing Pipeline]
    
    style A fill:#e3f2fd
    style N fill:#fff3e0
    style S fill:#e8f5e8
```

## 3. Data Processing Pipeline

### 3.1 Processing Stages

```mermaid
graph LR
    A[Raw Data Queue] --> B[Data Normalizer]
    B --> C[Duplicate Detector]
    C --> D[Data Enricher]
    D --> E[Quality Scorer]
    E --> F[Data Validator]
    F --> G[Processed Data Queue]
    
    subgraph "Enrichment Services"
        H[Geocoding Service]
        I[Venue Matcher]
        J[Sport Categorizer]
        K[Time Zone Converter]
    end
    
    D --> H
    D --> I
    D --> J
    D --> K
    
    style A fill:#ffebee
    style G fill:#e8f5e8
    style H fill:#f3e5f5
    style I fill:#f3e5f5
    style J fill:#f3e5f5
    style K fill:#f3e5f5
```

### 3.2 Data Normalization Process

```mermaid
flowchart TD
    A[Raw Game Data] --> B[Field Mapping]
    B --> C[Data Type Conversion]
    C --> D[Format Standardization]
    D --> E[Validation Rules]
    E --> F{Validation Pass?}
    F -->|Yes| G[Normalized Data]
    F -->|No| H[Validation Errors]
    
    G --> I[Sport Classification]
    I --> J[Venue Standardization]
    J --> K[Time Normalization]
    K --> L[Standardized Game Object]
    
    H --> M[Error Analysis]
    M --> N[Data Correction]
    N --> O{Correctable?}
    O -->|Yes| B
    O -->|No| P[Discard Data]
    
    style A fill:#e3f2fd
    style L fill:#e8f5e8
    style P fill:#ffebee
```

## 4. Real-time Data Streaming

### 4.1 Event-Driven Architecture

```mermaid
graph TB
    A[Data Changes] --> B[Change Detector]
    B --> C[Event Publisher]
    C --> D[Event Bus - Kafka]
    
    D --> E[Event Processor 1]
    D --> F[Event Processor 2]
    D --> G[Event Processor N]
    
    E --> H[WebSocket Updates]
    F --> I[Email Notifications]
    G --> J[Push Notifications]
    
    D --> K[Event Store]
    K --> L[Event Replay]
    K --> M[Analytics Pipeline]
    
    H --> N[Connected Clients]
    I --> O[Email Service]
    J --> P[Mobile Push Service]
    
    style D fill:#fff3e0
    style K fill:#f3e5f5
    style N fill:#e8f5e8
```

### 4.2 WebSocket Connection Management

```mermaid
sequenceDiagram
    participant Client as Mobile/Web Client
    participant Gateway as WebSocket Gateway
    participant Auth as Auth Service
    participant Sub as Subscription Service
    participant EventBus as Event Bus
    participant DB as Database
    
    Client->>Gateway: Connect with JWT
    Gateway->>Auth: Validate token
    Auth-->>Gateway: Token valid
    Gateway->>Sub: Get user subscriptions
    Sub->>DB: Query subscriptions
    DB-->>Sub: Return subscriptions
    Sub-->>Gateway: Subscription list
    Gateway->>EventBus: Subscribe to topics
    EventBus-->>Gateway: Subscription confirmed
    Gateway-->>Client: Connection established
    
    loop Real-time Updates
        EventBus->>Gateway: New event
        Gateway->>Gateway: Check subscriptions
        Gateway->>Client: Send update
    end
```

## 5. Data Storage Flow

### 5.1 Multi-layered Storage Strategy

```mermaid
graph TB
    A[Processed Data] --> B{Data Type?}
    B -->|Games| C[Games Table]
    B -->|Venues| D[Venues Table]
    B -->|Users| E[Users Table]
    B -->|Subscriptions| F[Subscriptions Table]
    
    C --> G[Primary Database - PostgreSQL]
    D --> G
    E --> G
    F --> G
    
    G --> H[Read Replicas]
    G --> I[Backup Storage]
    
    A --> J[Cache Layer - Redis]
    J --> K[API Cache]
    J --> L[Session Cache]
    J --> M[Query Cache]
    
    A --> N[Search Index - Elasticsearch]
    N --> O[Full-text Search]
    N --> P[Faceted Search]
    
    A --> Q[Analytics Store - ClickHouse]
    Q --> R[Time-series Data]
    Q --> S[Event Logs]
    Q --> T[Metrics]
    
    style G fill:#e8f5e8
    style J fill:#fff3e0
    style N fill:#f3e5f5
    style Q fill:#e1f5fe
```

### 5.2 Cache Invalidation Strategy

```mermaid
flowchart TD
    A[Data Update] --> B[Change Detection]
    B --> C{Cache Impact?}
    C -->|Game Data| D[Game Cache Keys]
    C -->|Venue Data| E[Venue Cache Keys]
    C -->|User Data| F[User Cache Keys]
    
    D --> G[Invalidate Game Lists]
    D --> H[Invalidate Search Results]
    E --> I[Invalidate Venue Details]
    F --> J[Invalidate User Sessions]
    
    G --> K[Cache Layer]
    H --> K
    I --> K
    J --> K
    
    K --> L[CDN Purge]
    L --> M[Edge Cache Update]
    
    style A fill:#e3f2fd
    style K fill:#fff3e0
    style M fill:#e8f5e8
```

## 6. API Data Flow

### 6.1 Request Processing Pipeline

```mermaid
sequenceDiagram
    participant Client as Client App
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant Cache as Cache Layer
    participant API as API Service
    participant DB as Database
    
    Client->>Gateway: API Request
    Gateway->>Auth: Validate token
    Auth-->>Gateway: Token valid
    Gateway->>Cache: Check cache
    Cache-->>Gateway: Cache miss
    Gateway->>API: Forward request
    API->>DB: Query data
    DB-->>API: Return data
    API->>API: Process data
    API->>Cache: Store in cache
    API-->>Gateway: Return response
    Gateway-->>Client: API Response
```

### 6.2 Search Flow

```mermaid
graph TB
    A[Search Request] --> B[Input Validation]
    B --> C[Query Parser]
    C --> D{Search Type?}
    D -->|Text| E[Elasticsearch]
    D -->|Geo| F[PostGIS Query]
    D -->|Filters| G[Database Query]
    
    E --> H[Search Results]
    F --> I[Location Results]
    G --> J[Filtered Results]
    
    H --> K[Result Merger]
    I --> K
    J --> K
    
    K --> L[Result Ranker]
    L --> M[Result Formatter]
    M --> N[Cache Storage]
    N --> O[API Response]
    
    style A fill:#e3f2fd
    style O fill:#e8f5e8
    style N fill:#fff3e0
```

## 7. Monitoring Data Flow

### 7.1 Metrics Collection

```mermaid
graph TB
    A[Application Metrics] --> B[Metrics Collector]
    C[System Metrics] --> B
    D[Business Metrics] --> B
    E[Custom Metrics] --> B
    
    B --> F[Metrics Aggregator]
    F --> G[Time-series Database]
    G --> H[Grafana Dashboard]
    
    F --> I[Alerting Rules]
    I --> J{Threshold Exceeded?}
    J -->|Yes| K[Alert Manager]
    J -->|No| L[Continue Monitoring]
    
    K --> M[Notification Service]
    M --> N[Email/SMS/Slack]
    
    style G fill:#e1f5fe
    style K fill:#ffebee
    style N fill:#fff3e0
```

### 7.2 Log Processing Flow

```mermaid
flowchart TD
    A[Application Logs] --> B[Log Aggregator]
    C[System Logs] --> B
    D[Access Logs] --> B
    E[Error Logs] --> B
    
    B --> F[Log Parser]
    F --> G[Log Enricher]
    G --> H[Log Storage - Elasticsearch]
    
    H --> I[Kibana Dashboard]
    H --> J[Log Analysis]
    J --> K[Anomaly Detection]
    K --> L{Anomaly Found?}
    L -->|Yes| M[Create Alert]
    L -->|No| N[Continue Processing]
    
    M --> O[Alert System]
    O --> P[Notification]
    
    style H fill:#e8f5e8
    style M fill:#ffebee
    style P fill:#fff3e0
```

## 8. Error Handling Flow

### 8.1 Error Processing Pipeline

```mermaid
graph TB
    A[Error Occurred] --> B[Error Classifier]
    B --> C{Error Type?}
    C -->|Transient| D[Retry Logic]
    C -->|Permanent| E[Dead Letter Queue]
    C -->|Critical| F[Immediate Alert]
    
    D --> G[Exponential Backoff]
    G --> H{Retry Limit?}
    H -->|Not Exceeded| I[Retry Operation]
    H -->|Exceeded| E
    
    I --> J{Success?}
    J -->|Yes| K[Continue Processing]
    J -->|No| A
    
    E --> L[Error Analysis]
    L --> M[Pattern Detection]
    M --> N[Root Cause Analysis]
    
    F --> O[Alert Manager]
    O --> P[Immediate Response]
    
    style F fill:#ffebee
    style K fill:#e8f5e8
    style P fill:#fff3e0
```

### 8.2 Circuit Breaker Pattern

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open : Failure threshold reached
    Open --> HalfOpen : Timeout expires
    HalfOpen --> Closed : Success
    HalfOpen --> Open : Failure
    
    state Closed {
        [*] --> Normal
        Normal --> Monitoring : Request
        Monitoring --> [*] : Response
    }
    
    state Open {
        [*] --> Blocked
        Blocked --> Fallback : Request
        Fallback --> [*] : Cached response
    }
    
    state HalfOpen {
        [*] --> Testing
        Testing --> Evaluating : Request
        Evaluating --> [*] : Response
    }
```

## 9. Backup and Recovery Flow

### 9.1 Data Backup Strategy

```mermaid
graph TB
    A[Primary Database] --> B[Backup Scheduler]
    B --> C[Full Backup]
    B --> D[Incremental Backup]
    B --> E[Transaction Log Backup]
    
    C --> F[Backup Storage]
    D --> F
    E --> F
    
    F --> G[Cross-region Replication]
    G --> H[Secondary Region]
    
    F --> I[Backup Validation]
    I --> J{Backup Valid?}
    J -->|Yes| K[Backup Catalog]
    J -->|No| L[Backup Retry]
    
    L --> B
    
    style F fill:#e8f5e8
    style H fill:#f3e5f5
    style K fill:#e1f5fe
```

### 9.2 Disaster Recovery Process

```mermaid
sequenceDiagram
    participant Monitor as Monitoring System
    participant DR as Disaster Recovery
    participant Primary as Primary Region
    participant Secondary as Secondary Region
    participant DNS as DNS Service
    
    Monitor->>DR: Disaster detected
    DR->>Primary: Attempt recovery
    Primary-->>DR: Recovery failed
    DR->>Secondary: Activate secondary
    Secondary-->>DR: Region activated
    DR->>DNS: Update DNS records
    DNS-->>DR: DNS updated
    DR->>Monitor: Failover complete
    
    Note over Secondary: Secondary region now primary
    
    Monitor->>DR: Primary region restored
    DR->>Primary: Sync data
    Primary-->>DR: Data synchronized
    DR->>DNS: Failback to primary
    DNS-->>DR: DNS updated
```

This comprehensive data flow documentation provides the detailed understanding needed to implement and maintain the sports scraping system's data processing capabilities.