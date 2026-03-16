# Data Model

The backend keeps a compact domain model aimed at a single-instance LAN workflow.

```mermaid
erDiagram
  PROJECT ||--o{ COLUMN : has
  PROJECT ||--o{ PROJECT_VIEW : saves
  PROJECT ||--o{ TASK : owns
  PROJECT ||--o{ LABEL : defines
  TASK ||--o{ COMMENT : has
  TASK }o--o{ LABEL : tagged_with
  PROJECT ||--o{ ACTIVITY_EVENT : emits

  PROJECT {
    string id PK
    string name
    string status
    datetime created_at
    datetime updated_at
  }
  COLUMN {
    string id PK
    string project_id FK
    string name
    string kind
    int position
  }
  PROJECT_VIEW {
    string id PK
    string project_id FK
    string name
    bool is_pinned
    bool is_default
    int position
    string label_ids
    string priorities
    string completion
  }
  TASK {
    string id PK
    string project_id FK
    string column_id FK
    string title
    string priority
    int position
    datetime deadline
  }
  LABEL {
    string id PK
    string project_id FK
    string name
    string color
  }
  COMMENT {
    string id PK
    string task_id FK
    string content
  }
  ACTIVITY_EVENT {
    string id PK
    string action
    string project_id
    string task_id
    datetime timestamp
  }
```

## Defaults

1. New projects create `Backlog`, `In Progress`, `Review`, and `Done`, each with an explicit `kind`.
2. Project archive is soft; project delete is hard and cascades through related data.
3. Dashboard metrics treat tasks in columns with `kind=done` as completed, even if the lane is renamed.
4. Project views persist board filter snapshots per project, can be pinned, and can mark one default board boot preset.
