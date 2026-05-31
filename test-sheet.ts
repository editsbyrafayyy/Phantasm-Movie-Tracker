import { getValues } from './lib/sheets';
async function run() {
  const rows = await getValues("'Movies List'!A3:O6");
  console.log(rows);
}
run();
