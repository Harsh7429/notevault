require("dotenv").config();

const { createApp } = require("./src/app");

const PORT = Number(process.env.PORT || 5000);
const app = createApp();

app.listen(PORT, () => {
  console.log(`NoteVault backend listening on port ${PORT}`);
});
