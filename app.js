const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note }} = require('./db');
const path = require('path');

app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async(req, res, next)=> {
  try {
    res.send({ token: await User.authenticate(req.body)});
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', async(req, res, next)=> {
  try {
    console.log(req.headers)
    res.send(await User.byToken(req.headers.authorization));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users/:userId/notes', async (req,res,next) => {
  try {
    console.log('HEADERS', req.headers)
    const user = await User.byToken(req.headers.authorization);
    if(user.id === parseInt(req.params.userId)){
      const notes = await Note.findAll({
        where: {userId: user.id}
      })
      res.send(notes);
    } else{
      const err = new Error ('Invalid User Access');
      throw err;
    }
  } catch (error) {
    next(error)
  }
})

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;