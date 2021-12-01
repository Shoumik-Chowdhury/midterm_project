/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */
require("dotenv").config();

const express = require('express');
const router = express.Router();
const mailgunParams = require("../lib/mailgun.js");
const mailgun = require("mailgun-js");


const mg = mailgun(mailgunParams);


module.exports = (db) => {//passed to server.js

  return router.post("/", (req, res) => {
    const allOptions = [req.body.option1, req.body.option2, req.body.option3, req.body.option4, req.body.option5, req.body.option6, req.body.option7, req.body.option8];
    const arrayOfOptions = allOptions.filter((option) => option.length > 0);

    //HELPER FUNCTION
    const generateRandomString = () => {
      return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
    };
    ////////////////
    const link1admin = generateRandomString();
    const link2everyone = generateRandomString();

    db.query(
      `
    INSERT INTO polls (
      email, title, description, administrative_link, submission_link)
      VALUES (
      $1, $2, $3, $4, $5)
      RETURNING *;
      `, [req.body.email, req.body.title, req.body.description, link1admin, link2everyone])

      .then(() => {

        db.query(
          `
          SELECT *
          FROM polls
          WHERE administrative_link = $1
          `, [link1admin])

          .then(result => {

            arrayOfOptions.forEach((option) => {
              db.query(
                `
              INSERT INTO option_results (
                poll_id, option_name, option_value)
                VALUES (
                $1, $2, $3)
                RETURNING *;
                `, [result.rows[0]["id"], option, 0]

              )

            })
              //to ?? security
              const data = {
                from: 'Example <EMAIL@EMAIL>',
                to: 'EMAIL@EMAIL',
                subject: 'Hello world',
                text: `Here are your links! Share with your friends: localhost:8080/polls/${link2everyone} Use to track the results: localhost:8080/results/${link1admin}`
              };
              mg.messages().send(data, function(error, body) {
                if (error) {
                  console.log(error);
                }
                console.log(body);
              });

            res.json({ link1admin, link2everyone })
          })
        ////////////////trying something

      })

      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });
};

