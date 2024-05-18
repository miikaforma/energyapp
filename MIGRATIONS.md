# Migrations


1. Pulling the changes from DB
```
npx prisma db pull
```

2. Creating a migration of the changes
```
npx prisma migrate dev --name <migrationName> --create-only
```

3. In case migration wants to reset DB, say no and create it manually and then run
```
npx prisma migrate resolve --applied <migrationName>
```

4. Applying the changes to production
```
npx prisma migrate deploy
```