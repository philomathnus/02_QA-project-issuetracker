const chaiHttp = require('chai-http');
const chai = require('chai');
const chaiExclude = require('chai-exclude');
const chaiSpies = require('chai-spies');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);
chai.use(chaiExclude);
chai.use(chaiSpies);

const testIssues = [
  {
    "_id": "67e11616134c1f00138a33bf",
    "issue_title": "Test issue 1",
    "issue_text": "Test issue 1 in project testproj",
    "created_by": "me1",
    "assigned_to": "you1",
    "status_text": "open",
    "open": true,
    "created_on": "2025-03-25T08:21:42.420Z",
    "updated_on": "2025-03-25T08:21:42.420Z"
  },
  {
    "_id": "67e11616134c1f00138a33be",
    "issue_title": "Test issue 2",
    "issue_text": "Test issue 2 in project testproj",
    "created_by": "me1",
    "assigned_to": "you",
    "status_text": "open",
    "open": false,
    "created_on": "2026-03-25T08:21:42.420Z",
    "updated_on": "2026-03-25T08:21:42.420Z"
  },
  {
    "_id": "67e11616134c1f00138a33bg",
    "issue_title": "Test issue 3",
    "issue_text": "Test issue 3 in project testproj",
    "created_by": "me1",
    "assigned_to": "you",
    "status_text": "open",
    "open": true,
    "created_on": "2025-03-25T08:21:42.420Z",
    "updated_on": "2025-03-25T08:21:42.420Z"
  }
];

suite('Functional Tests', function () {
  this.beforeEach((done) => {
    global.localStorage = {
      store: {
        'testproj': JSON.stringify(testIssues)
      },
      setItem(keyName, value) {
        this.store[keyName] = value;
      },

      getItem(keyName) {
        return this.store[keyName]
      }
    };
    //chai.spy.on(localStorage, ['setItem', 'getItem'], () => {});
    done();
  });

  test('Create an issue with every field: POST request to /api/issues/{project}', (done) => {
    const expected = {
      "assigned_to": "you",
      "status_text": "open",
      "open": true,
      "_id": "67e11616134c1f00138a33bf",
      "issue_title": "MyFullTest",
      "issue_text": "MyFullTestText",
      "created_by": "me",
      "created_on": "2025-03-24T08:21:42.420Z",
      "updated_on": "2025-03-24T08:21:42.420Z"
    };
    chai
      .request(server)
      .keepOpen()
      .post('/api/issues/apitest')
      .type('form')
      .send({
        issue_title: 'MyFullTest',
        issue_text: 'MyFullTestText',
        created_by: 'me',
        assigned_to: 'you',
        status_text: 'open'
      })
      .end((err, res) => {
        const actual = JSON.parse(res.text);
        assert.equal(res.status, 200, 'Response status should be 200');
        assert.deepEqualExcluding(actual, expected, ['_id', 'created_on', 'updated_on']);
        assert.isNotEmpty(actual._id);
        assert.isNotEmpty(actual.created_on);
        assert.isNotEmpty(actual.updated_on);
        done();
      });
  });

  test('Create an issue with only required fields: POST request to /api/issues/{project}', (done) => {
    const expected = {
      "assigned_to": "",
      "status_text": "",
      "open": true,
      "_id": "67e11616134c1f00138a33bf",
      "issue_title": "MyFullTest",
      "issue_text": "MyFullTestText",
      "created_by": "me",
      "created_on": "2025-03-24T08:21:42.420Z",
      "updated_on": "2025-03-24T08:21:42.420Z"
    };
    chai
      .request(server)
      .keepOpen()
      .post('/api/issues/apitest')
      .type('form')
      .send({
        issue_title: 'MyFullTest',
        issue_text: 'MyFullTestText',
        created_by: 'me'
      })
      .end((err, res) => {
        const actual = JSON.parse(res.text);
        assert.equal(res.status, 200, 'Response status should be 200');
        assert.deepEqualExcluding(actual, expected, ['_id', 'created_on', 'updated_on']);
        assert.isNotEmpty(actual._id);
        assert.isNotEmpty(actual.created_on);
        assert.isNotEmpty(actual.updated_on);
        done();
      });
  });

  test('Create an issue with missing required fields: POST request to /api/issues/{project}', (done) => {
    const expected = { error: 'required field(s) missing' };
    chai
      .request(server)
      .keepOpen()
      .post('/api/issues/apitest')
      .type('form')
      .send({})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), expected);
        done();
      });
  });

  test('View issues on a project: GET request to /api/issues/{project}', (done) => {
    chai
      .request(server)
      .keepOpen()
      .get('/api/issues/testproj')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), testIssues);
        done();
      });
  });

  test('View issues on a project with one filter: GET request to /api/issues/{project}', (done) => {
    const expected = [
      testIssues[1]
    ];
    chai
      .request(server)
      .keepOpen()
      .get('/api/issues/testproj?open=false')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), expected);
        done();
      });
  });

  test('View issues on a project with multiple filters: GET request to /api/issues/{project}', (done) => {
    const expected = [
      testIssues[0],
      testIssues[2]
    ];
    chai
      .request(server)
      .keepOpen()
      .get('/api/issues/testproj?created_by=me1&created_on=2025-03-25')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), expected);
        done();
      });
  });

  test('Update one field on an issue: PUT request to /api/issues/{project}', (done) => {
    const updatedTitleText = 'Test issue 1 - Updated';
    const expected = {
      result: 'successfully updated', 
      _id: '67e11616134c1f00138a33bf' 
    };
    chai
      .request(server)
      .keepOpen()
      .put('/api/issues/testproj')
      .type('form')
      .send({
        _id: '67e11616134c1f00138a33bf',
        issue_title: updatedTitleText
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), expected);
        const changedIssue = JSON.parse(localStorage.getItem('testproj')).filter(issue => issue._id === '67e11616134c1f00138a33bf')[0];
        assert.equal(changedIssue.issue_title, updatedTitleText);
        done();
      });
  });

  test('Update multiple fields on an issue: PUT request to /api/issues/{project}', (done) => {
    const updatedTitleText = 'Test issue 1 - Updated';
    const updatedAssignedTo = 'Nobody';
    const expected = {
      result: 'successfully updated', 
      _id: '67e11616134c1f00138a33bf' 
    };
    chai
      .request(server)
      .keepOpen()
      .put('/api/issues/testproj')
      .type('form')
      .send({
        _id: '67e11616134c1f00138a33bf',
        issue_title: updatedTitleText,
        assigned_to: updatedAssignedTo
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), expected);
        const changedIssue = JSON.parse(localStorage.getItem('testproj')).filter(issue => issue._id === '67e11616134c1f00138a33bf')[0];
        assert.equal(changedIssue.issue_title, updatedTitleText);
        assert.equal(changedIssue.assigned_to, updatedAssignedTo);
        done();
      });
  });

  test('Update an issue with missing _id: PUT request to /api/issues/{project}', (done) => {
    const expected = { error: 'missing _id' };
    chai
      .request(server)
      .keepOpen()
      .put('/api/issues/testproj')
      .type('form')
      .send({
        issue_title: 'does not matter -> no id given'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), expected);
        done();
      });
  });

  test('Update an issue with no fields to update: PUT request to /api/issues/{project}', (done) => {
    const expected = { 
      error: 'no update field(s) sent', 
      _id: '67e11616134c1f00138a33bf' 
    };
    chai
      .request(server)
      .keepOpen()
      .put('/api/issues/testproj')
      .type('form')
      .send({
        _id: '67e11616134c1f00138a33bf'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), expected);
        done();
      });
  });

  test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', (done) => {
    const expected = { 
      error: 'could not update', 
      _id: 'none existing' 
    };
    chai
      .request(server)
      .keepOpen()
      .put('/api/issues/testproj')
      .type('form')
      .send({
        _id: 'none existing',
        issue_text: 'alibi change'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), expected);
        done();
      });
  });

  test('Delete an issue: DELETE request to /api/issues/{project}', (done) => {
    const expected = { 
      result: 'successfully deleted', 
      _id: '67e11616134c1f00138a33bf'
    };
    chai
      .request(server)
      .keepOpen()
      .delete('/api/issues/testproj')
      .type('form')
      .send({
        _id: '67e11616134c1f00138a33bf'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), expected);
        assert.isEmpty(JSON.parse(localStorage.getItem('testproj')).filter(issue => issue._id === '67e11616134c1f00138a33bf'));
        done();
      });
  });

  test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', (done) => {
    const expected = { 
      error: 'could not delete', 
      _id: 'invalid' 
    };
    chai
      .request(server)
      .keepOpen()
      .delete('/api/issues/testproj')
      .type('form')
      .send({
        _id: 'invalid'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), expected);
        done();
      });
  });

  test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', (done) => {
    const expected = { error: 'missing _id' };
    chai
      .request(server)
      .keepOpen()
      .delete('/api/issues/testproj')
      .type('form')
      .send({})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(JSON.parse(res.text), expected);
        done();
      });
  });
});
