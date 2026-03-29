import { createServer } from "./app.js";

const port = Number(process.env.PORT || 4000);
const app = createServer();

app.listen(port, () => {
  console.log(`PulsePath API running on http://localhost:${port}`);
});
