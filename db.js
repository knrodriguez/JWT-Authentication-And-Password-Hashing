const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const { STRING } = Sequelize;
const config = {
  logging: false
};

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.byToken = async(token)=> {
  try {
    //https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    const verifiedUser = await jwt.verify(token, process.env.JWT);
    //how do I know what exists in the verifiedUser object? Documentation and console.logs!
    if(verifiedUser.userId){
      const user = await User.findByPk(verifiedUser.userId);
      return user;
    }
    // const user = await User.findByPk(token);
    // if(user){
    //   return user;
    // }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username,
      // password
    }
  });
  if(user && await bcrypt.compare(password, user.password)){
    //https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
    const token = jwt.sign({userId: user.id}, process.env.JWT)
    return token; 
    //return user.id;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.beforeValidate(async user => {
  //Sequelize method - https://sequelize.org/master/class/lib/model.js~Model.html#instance-method-changed
  if(user.changed('password')){
    user.password = await bcrypt.hash(user.password, 10)
  }
})

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User
  }
};