const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/Todo');
const { Users } = require('./models/Users');
const { authenticated } = require('./middleware/authenticated');

const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  const newTodo = new Todo({
    text: req.body.text
  });

  newTodo
    .save()
    .then(result => {
      res.send(result);
    })
    .catch(err => {
      res.send(err);
    });
});

app.get('/todos', (req, res) => {
  Todo.find()
    .then(todos => {
      res.send(todos);
    })
    .catch(err => console.log(err));
});

app.get('/todos/:id', (req, res) => {
  const id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send('Id do not exist');
  }
  Todo.findById(id)
    .then(todoId => {
      if (!todoId) {
        return res.status(404).send('Id not found');
      }
      res.send(todoId);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

app.delete('/todos/:id', (req, res) => {
  const id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send('Id do not exist');
  }
  Todo.findOneAndDelete(id)
    .then(todoId => {
      if (!todoId) {
        return res.status(404).send('Id not found');
      }
      res.send(todoId);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

app.patch('/todos/:id', (req, res) => {
  const id = req.params.id;
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send('Id do not exist');
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    (body.completed = false), (body.completedAt = null);
  }

  Todo.findOneAndUpdate(id, { $set: body }, { new: true })
    .then(todo => {
      if (!todo) {
        return res.status(404).send();
      }

      res.send(todo);
    })
    .catch(err => {
      res.status(404).send(err);
    });
});

//Create User
app.post('/users', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);
  const newUser = new Users(body);

  newUser
    .save()
    .then(() => {
      return newUser.generateAuthToken();
    })
    .then(token => {
      res.header('x-auth', token).send(newUser);
    })
    .catch(err => {
      res.send(err);
    });
});

app.get('/users/me', authenticated, (req, res) => {
  res.send(req.user);
});

app.post('/users/login', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);
});

app.listen(port, () => {
  mongoose.set('useFindAndModify', false);
  console.log(`Started on port ${port}`);
});
