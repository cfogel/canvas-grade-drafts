import { API_KEY, SPREADSHEET_ID, SPREADSHEET_RANGE, CANVAS_TOKEN, CANVAS_ENDPOINT } from "./config.js";
const SHEETS_ENDPOINT = "https://sheets.googleapis.com";

const emptyRubric = rubric => Object.fromEntries(Object.keys(rubric).flatMap(k => [[`rubric_assessment[${k}][points]`,''],[`rubric_assessment[${k}][rating_id]`,''],[`rubric_assessment[${k}][comments]`,'']]))
const rubricToParams = rubric => Object.fromEntries(Object.entries(rubric).flatMap(([key,{rating_id,comments,points}])=>[[`rubric_assessment[${key}][points]`,points],[`rubric_assessment[${key}][rating_id]`,rating_id],[`rubric_assessment[${key}][comments]`,comments]]))

chrome.action.onClicked.addListener(async (tab) => {
    //await saveData(tab)
});

chrome.commands.onCommand.addListener(async (command,tab) => {
    switch (command) {
        case 'save-grade':
            await saveData(tab);
            break;
        case 'load-grade':
            await loadData(tab);
            break;
    }
})

async function saveData(tab) {
    const [,courseId,assignmentId,studentId] = /\/courses\/(\d+)\/gradebook\/speed_grader\?assignment_id=(\d+)&student_id=(\d+)/.exec(tab.url)
    const data = await getSubmission(courseId,assignmentId,studentId)
    //console.log(data)

    const { attempt, grade, submission_comments, rubric_assessment, grader_id, graded_at } = data

    var { token } = await chrome.identity.getAuthToken({interactive: true});

    /* Spreadsheet fields:
        course | assignment | student | (attempt) | grade | (comments from grader) | rubric | (grader) | grading timestamp | (loaded) 
    */

    const newRow = await addRows(token, [courseId, assignmentId, studentId, attempt, grade, JSON.stringify(submission_comments.filter(({author_id}) => author_id == grader_id).map(({comment}) => comment)), JSON.stringify(rubric_assessment), grader_id, graded_at, false])

    if (newRow?.updates?.updatedRows) {
        const newData = await updateGrade(courseId,assignmentId,studentId,emptyRubric(rubric_assessment))
        //console.log(newData)
    }
}

async function loadData(tab) {
    const [,courseId,assignmentId,studentId] = /\/courses\/(\d+)\/gradebook\/speed_grader\?assignment_id=(\d+)&student_id=(\d+)/.exec(tab.url)

    var { token } = await chrome.identity.getAuthToken({interactive: true});
    const { values:rows } = await getRows(token)

    const data = rows.filter(([course,assignment,student,...rest]) => (course == courseId) && (assignment == assignmentId) && (student == studentId) && !rest.at(-1))
                     .toSorted((a,b)=>Date.parse(a[8])-Date.parse(b[8])).at(-1) // the most recent row for the course/assignment/student

    const [,,,,grade,,rubric] = data;

    let newData = await updateGrade(courseId,assignmentId,studentId,{...rubricToParams(JSON.parse(rubric)), 'submission[posted_grade]':grade})
    if (newData.grade != grade) { // manual adjustments to rubric sums require a second API request
        newData = await updateGrade(courseId,assignmentId,studentId,{'submission[posted_grade]':grade})
    }
    //console.log(newData)
}

async function getSubmission(course,assignment,student) {
    const init = {
        method: 'Get',
        headers: {Authorization: `Bearer ${CANVAS_TOKEN}`},
        mode: 'no-cors'
    }
    return fetch(`${CANVAS_ENDPOINT}/api/v1/courses/${course}/assignments/${assignment}/submissions/${student}?${new URLSearchParams([['include[]','rubric_assessment'],['include[]','submission_comments']])}`,init).then(r => r.json())
}

async function addRows(token,...vals) {
    const init = {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`,'Content-Type': 'application/json'},
        body: JSON.stringify({
            values: vals
        })
    }
    return fetch(`${SHEETS_ENDPOINT}/v4/spreadsheets/${SPREADSHEET_ID}/values/${SPREADSHEET_RANGE}:append?valueInputOption=RAW&key=${API_KEY}`,init).then(r => r.json())
}

async function getRows(token) {
    const init = {
        method: 'Get',
        headers: {Authorization: `Bearer ${token}`,'Content-Type': 'application/json'}
    }
    return fetch(`${SHEETS_ENDPOINT}/v4/spreadsheets/${SPREADSHEET_ID}/values/${SPREADSHEET_RANGE}?valueRenderOption=UNFORMATTED_VALUE&key=${API_KEY}`,init).then(r => r.json())
}

async function updateGrade(course,assignment,student,newGrades) {
    const init = {
        method: 'PUT',
        headers: {Authorization: `Bearer ${CANVAS_TOKEN}`},
        body: new URLSearchParams(newGrades)
    }
    return fetch(`${CANVAS_ENDPOINT}/api/v1/courses/${course}/assignments/${assignment}/submissions/${student}`,init).then(r => r.json())
}

async function addComments(course,assignment,student,comments) {
    return Promise.all(comments.map(comment=>updateGrade(course,assignment,student,{'comment[text_comment]':comment})))
}

async function deleteComment(course,assignment,student,comment) {
    const init = {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${CANVAS_TOKEN}`}
    }
    return fetch(`${CANVAS_ENDPOINT}/api/v1/courses/${course}/assignments/${assignment}/submissions/${student}/comments/${comment}`,init).then(r => r.json())
}