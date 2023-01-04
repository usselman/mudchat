const express = require("express");
const { HandCashConnect } = require("@handcash/handcash-connect");
const app = express(),
  port = 9004;

const dotenv = require("dotenv");
dotenv.config();
const tokenSecret = process.env.APP_SECRET;
const tokenID = process.env.APP_ID;

const handCashConnect = new HandCashConnect({
  appID: tokenID,
  appSecret: tokenSecret,
});

app.use(express.static("public"));
app.use(
  express.json({ type: ["application/json", "text/plain"], limit: "50mb" })
);
app.use((req, res, next) => {
  //custom domain instead of *
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, Content-Type");
  next();
});

app.get("/", (req, res) => {
  res.send("index.html", { root: __dirname });
});

app.post("/hcaccount", async (req, res) => {
  const { hcauth } = req.body;
  console.log({ hcauth });
  if (hcauth) {
    const cloudAccount = await handCashConnect.getAccountFromAuthToken(hcauth);
    const { publicProfile } = await cloudAccount.profile.getCurrentProfile();
    console.log(publicProfile);
    res.send(publicProfile);
  }
});

app.post("/hcpost", async (req, res) => {
  const { hcauth, payload, action } = req.body;
  let hexArray = [];
  payload.forEach((p) => {
    hexArray.push(Buffer.from(p).toString("hex"));
  });
  console.log(payload);
  try {
    const cloudAccount = await handCashConnect.getAccountFromAuthToken(hcauth);
    const paymentParameters = {
      appAction: action,
      description: "BitChat Message",
    };
    if (payload) {
      paymentParameters.attachment = { format: "hexArray", value: hexArray };
    }
    const paymentResult = await cloudAccount.wallet.pay(paymentParameters);
    console.log(paymentResult);
    res.send(paymentResult);
  } catch (e) {
    res.send({ error: e });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
