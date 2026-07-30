# Connect Next.js to Charity API

## "fetch failed" on register / login

The Next app **cannot reach** the .NET API. The API was **not listening** on `http://127.0.0.1:5173` when tested.

### Fix (two terminals)

**Terminal 1 — API (required first)**

```powershell
cd D:\church\churchapi
dotnet run --project src\Charity.Api --launch-profile http
```

Wait until you see: `Now listening on: http://localhost:5173`  
Check: open **http://localhost:5173/swagger**

**Terminal 2 — Next.js**

```powershell
cd D:\church\nextchuch\test2\test2
npm run dev
```

After changing `.env.local`, **restart** `npm run dev`.

### Environment (`.env.local`)

```env
CHARITY_API_URL=http://127.0.0.1:5173
NEXT_PUBLIC_CHARITY_API_URL=http://127.0.0.1:5173
```

If your API uses another URL (e.g. `https://localhost:7098`), set **both** variables to that URL.

### Test connection

With both apps running, open:

**http://localhost:3000/charity-api/swagger/index.html**

If Swagger loads, register on **http://localhost:3000/signup** should work.

### Password rules (API)

- At least 8 characters  
- Uppercase, lowercase, and a digit  
- Example: `Test@1234`
