'use strict';

const { request } = require("chai");
const { param } = require("../server");

module.exports = function (app) {

  const getCurrentIssuesForProject = (project) => {
    return JSON.parse(localStorage.getItem(project) || "[]");
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
      .replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0,
          v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
  }

  const getCurrentDateTimeAsString = () => {
    return new Date().toJSON();
  };

  const updateIssue = (issueToUpdate, requestBody, updateDateTime) => {
    Object.keys(requestBody).forEach(property => issueToUpdate[property] = requestBody[property]);
    issueToUpdate.updated_on = updateDateTime;
    return issueToUpdate;
  }

  const createNewIssue = (requestBody, uuid, dateTimeAsString) => {
    return {
      '_id': uuid,
      'assigned_to': (requestBody.assigned_to !== undefined) ? requestBody.assigned_to : '',
      'status_text': (requestBody.status_text !== undefined) ? requestBody.status_text : '',
      'issue_title': requestBody.issue_title,
      'issue_text': requestBody.issue_text,
      'created_by': requestBody.created_by,
      'created_on': dateTimeAsString,
      'updated_on': dateTimeAsString,
      'open': true
    };
  };

  const checkValidInput = (requestBody) => {
    return requestBody.issue_title && requestBody.issue_text && requestBody.created_by;
  };

  const applyQueryParams = (queryParamsObj, issuesArray) => {
    let resultSet = new Set();
    if (Object.keys(queryParamsObj).length === 0 && queryParamsObj.constructor === Object) {
      return issuesArray;
    } else {
      for (const key in queryParamsObj) {
        let filteredIssues = issuesArray.filter(issue => issueContainsKeyValue(key, queryParamsObj[key], issue));
        if (filteredIssues.length > 0) {
          if (resultSet.size > 0) {
            // only keep elements which are both in the set (previous query) and the new result
            resultSet = resultSet.intersection(new Set(filteredIssues));
          } else {
            // the set is empty, fill with all found elements
            filteredIssues.forEach(element => resultSet.add(element));
          }
        }
      }
    }
    return (resultSet.size > 0) ? [...resultSet] : issuesArray;
  };

  const issueContainsKeyValue = (key, value, issue) => {
    return new String(issue[key]) === value || new String(issue[key]).startsWith(value);
  };

  app.route('/api/issues/:project')

    .get(function (req, res) {
      let project = req.params.project;
      let issuesForProject = JSON.parse(localStorage.getItem(project) || "[]");
      if (issuesForProject.length > 0) {
        issuesForProject = applyQueryParams(req.query, issuesForProject);
      }
      res.json(issuesForProject);
    })

    .post(function (req, res) {
      if (checkValidInput(req.body)) {
        let project = req.params.project;
        const currentDatetime = getCurrentDateTimeAsString();
        const uuid = generateUUID();
        const newIssue = createNewIssue(req.body, uuid, currentDatetime);

        let issues = getCurrentIssuesForProject(project);
        issues.push(newIssue);
        localStorage.setItem(project, JSON.stringify(issues));

        res.json(newIssue);
      } else {
        res.json({
          error: 'required field(s) missing'
        });
      }
    })

    .put(function (req, res) {
      let project = req.params.project;
      if (!req.body._id) {
        res.json({ error: 'missing _id' });
      } else if (Object.keys(req.body).length === 1) {
        res.json({ error: 'no update field(s) sent', _id: req.body._id });
      }
      else {
        try {
          let issues = getCurrentIssuesForProject(project);
          let issuesToUpdate = issues.filter(issue => issue._id === req.body._id);
          if (issuesToUpdate.length === 1) {
            //remove org issue from issues
            issues = issues.filter(issue => issue._id !== req.body._id);
            //update issue with new values
            const currentDatetime = getCurrentDateTimeAsString();
            let updatedIssue = updateIssue(issuesToUpdate[0], req.body, currentDatetime);
            //add updated issue to other issues
            issues.push(updatedIssue);
            //set the issues of the project to the localstore
            localStorage.setItem(project, JSON.stringify(issues));

            res.json({
              result: 'successfully updated',
              _id: req.body._id
            });
          } else {
            res.json({ error: 'could not update', _id: req.body._id });
          }
        } catch (e) {
          res.json({ error: 'could not update', _id: req.body._id });
        }
      }
    })

    .delete(function (req, res) {
      if (!req.body._id) {
        res.json({ error: 'missing _id' });
      } else {
        const project = req.params.project;
        let issues = getCurrentIssuesForProject(project);
        const orgNumOfIssues = issues.length;
        issues = issues.filter(issue => issue._id !== req.body._id);
        if (issues.length === orgNumOfIssues) {
          res.json({
            error: 'could not delete',
            _id: req.body._id
          });
        } else {
          localStorage.setItem(project, JSON.stringify(issues));
          res.json({
            result: 'successfully deleted',
            _id: req.body._id
          });
        }
      }
    });

};
