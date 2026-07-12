require('dotenv').config();
const app = require('./app');
const connectDB = require('./database/index');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`⚙️  Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('MONGO db connection failed !!! ', err);
  });
