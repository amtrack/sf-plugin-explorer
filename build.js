import { getAllPackages } from "./index.js";

async function main() {
  const packageResults = await getAllPackages();
  console.log(JSON.stringify(packageResults));
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
