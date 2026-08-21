import app from './app';
import config from './config';

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`🚀 OpsFlow ERP API is running in ${config.NODE_ENV} mode on port ${PORT}`);
});
