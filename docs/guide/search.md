# Cross-Project Search

The search page lets you find skills across all your projects in one place.

## Using Search

Navigate to **Search** from the sidebar. The search interface has:

- A **search bar** at the top for text queries
- A **filter panel** (collapsible) with project, model, and tag filters
- **Results** grouped by project

### Text Search

Type a query to search across skill names, descriptions, and body content. Search uses a 300ms debounce so results update as you type without hammering the API.

### Filters

Narrow results with any combination of:

| Filter | Description |
|---|---|
| **Project** | Limit results to a specific project |
| **Model** | Filter by target model (e.g., `claude-sonnet-4-6`) |
| **Tags** | Multi-select tags to filter by |

Click **Clear Filters** to reset all filters at once.

### Results

Results are grouped by project. Each project section shows the project name and matching skill count, with a grid of skill cards. Click any card to open the skill in the editor.

## API

```
GET /api/search?q=review&tags=security&project_id=uuid&model=claude-sonnet-4-6
```

All parameters are optional. Returns skills matching the query, grouped by project.
