# Generated Code

This directory contains **auto-generated** code from the backend API schema.

## ⚠️ Important

**DO NOT** manually edit files in this directory. All changes will be overwritten when the code is regenerated.

## Structure

```
generated/
├── actions/          # Server actions (next-safe-action)
├── client/           # API client classes
├── hooks/            # React Query hooks
├── lib/              # Generated utilities
├── schemas/          # Zod schemas
└── services/         # Service utilities
```

## Usage

### Using Generated Hooks

```typescript
import { usePhotosGetMany } from "@/generated/hooks/photos";

function MyComponent() {
  const { data, isLoading } = usePhotosGetMany();
  // ...
}
```

### Using Generated Actions

```typescript
import { createPhotoAction } from "@/generated/actions/photos";

const result = await createPhotoAction({ title: "My Photo" });
```

### Using API Client

```typescript
import { apiClient } from "@/generated/client";

const photos = await apiClient.photos.getMany();
```

## Regeneration

To regenerate this code, run the code generation script (usually from the backend or a separate tool).

## Notes

- All types are automatically inferred from the API schema
- Hooks use React Query for caching and state management
- Actions use next-safe-action for type-safe server actions

