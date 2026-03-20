# Project Visualization

The visualization tab provides an interactive graph of your project's skill relationships, agent assignments, and provider connections.

## Accessing the Graph

Navigate to a project and open the **Visualize** tab. The graph renders automatically using D3.js.

## What the Graph Shows

### Skill Dependencies

Nodes represent skills, and edges represent [include](./includes) relationships. If skill A includes skill B, an arrow points from A to B. This makes it easy to see:

- Which skills are composed from others
- Which skills are shared dependencies (many arrows pointing in)
- Whether there are circular dependencies (highlighted in red)

### Agent Assignments

Enabled agents appear as a distinct node type connected to their assigned skills. This shows at a glance which skills feed into which agents.

### Circular Dependencies

If the graph detects a circular dependency (A includes B, B includes C, C includes A), the cycle is highlighted. Circular dependencies are also caught by the [include resolver](./includes) at sync time, but the graph provides a visual way to spot them.

## Interacting with the Graph

- **Zoom** -- Scroll to zoom in and out
- **Pan** -- Click and drag the background to pan
- **Drag nodes** -- Click and drag a node to reposition it
- **Click a node** -- Highlights the node and its immediate connections

## API

```
GET /api/projects/{id}/graph
```

Returns the graph data structure with nodes (skills, agents) and edges (includes, assignments), plus any detected circular dependencies.
