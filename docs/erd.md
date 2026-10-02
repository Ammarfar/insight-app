erDiagram
    USER ||--o{ INSIGHT : owns
    USER ||--o{ SOURCE : owns
    USER ||--o{ TOPIC : owns
    USER ||--o{ XP_EVENT : earns
    USER ||--|| USER_PROGRESS : has
    USER ||--o{ BACKUP : creates

    SOURCE ||--o{ INSIGHT : produces

    INSIGHT ||--o{ INSIGHT_TOPIC : categorized_as
    TOPIC ||--o{ INSIGHT_TOPIC : contains

    INSIGHT ||--o{ INSIGHT_REVIEW : reviewed

    INSIGHT ||--o{ INSIGHT_CONNECTION : source
    INSIGHT ||--o{ INSIGHT_CONNECTION : target

    USER {
        uuid id PK
        varchar email
        varchar name
        varchar avatar_url
        timestamp created_at
        timestamp updated_at
    }

    INSIGHT {
        uuid id PK
        uuid user_id FK
        uuid source_id FK
        varchar title
        text content
        timestamp created_at
        timestamp updated_at
    }

    SOURCE {
        uuid id PK
        uuid user_id FK
        varchar type
        varchar title
        varchar author
        text url
        timestamp created_at
        timestamp updated_at
    }

    TOPIC {
        uuid id PK
        uuid user_id FK
        varchar name
        varchar color
        timestamp created_at
        timestamp updated_at
    }

    INSIGHT_TOPIC {
        uuid insight_id FK
        uuid topic_id FK
        timestamp created_at
    }

    INSIGHT_CONNECTION {
        uuid id PK
        uuid user_id FK
        uuid source_insight_id FK
        uuid target_insight_id FK
        timestamp created_at
    }

    INSIGHT_REVIEW {
        uuid id PK
        uuid insight_id FK
        varchar result
        timestamp reviewed_at
    }

    XP_EVENT {
        uuid id PK
        uuid user_id FK
        varchar type
        integer amount
        uuid entity_id
        timestamp created_at
    }

    USER_PROGRESS {
        uuid user_id PK
        integer total_xp
        integer level
        integer current_streak
        integer longest_streak
        date last_learning_date
        timestamp updated_at
    }

    BACKUP {
        uuid id PK
        uuid user_id FK
        varchar drive_file_id
        integer version
        varchar type
        varchar status
        timestamp created_at
    }