import { CANVAS_TOKEN, CANVAS_ENDPOINT, API_KEY, SPREADSHEET_ID } from "./config.js";

export const SHEETS_ENDPOINT = "https://sheets.googleapis.com";

export async function getAssignment(course, assignment) {
    const init = {
        method: 'Get',
        headers: { Authorization: `Bearer ${CANVAS_TOKEN}` },
        mode: 'no-cors'
    };
    return fetch(`${CANVAS_ENDPOINT}/api/v1/courses/${course}/assignments/${assignment}`, init).then(r => r.json());
}

export async function getCourse(course) {
    const init = {
        method: 'Get',
        headers: { Authorization: `Bearer ${CANVAS_TOKEN}` },
        mode: 'no-cors'
    };
    return fetch(`${CANVAS_ENDPOINT}/api/v1/courses/${course}`, init).then(r => r.json());
}

export async function getUser(id) {
    const init = {
        method: 'Get',
        headers: { Authorization: `Bearer ${CANVAS_TOKEN}` },
        mode: 'no-cors'
    };
    return fetch(`${CANVAS_ENDPOINT}/api/v1/users/${id}/profile`, init).then(r => r.json());
}

export async function getSubmission(course, assignment, student, include) {
    const init = {
        method: 'Get',
        headers: { Authorization: `Bearer ${CANVAS_TOKEN}` },
        mode: 'no-cors'
    };
    return fetch(`${CANVAS_ENDPOINT}/api/v1/courses/${course}/assignments/${assignment}/submissions/${student}?${new URLSearchParams(include.map(i => ['include[]', i]))}`, init).then(r => r.json());
}

export async function addRows(token, range, ...vals) {
    const init = {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            values: vals
        })
    };
    return fetch(`${SHEETS_ENDPOINT}/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=RAW&key=${API_KEY}`, init).then(r => r.json());
}

export async function updateRows(token, range, ...vals) {
    const init = {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            values: vals
        })
    };
    return fetch(`${SHEETS_ENDPOINT}/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueInputOption=RAW&key=${API_KEY}`, init).then(r => r.json());
}

export async function getRows(token, range) {
    const init = {
        method: 'Get',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    };
    return fetch(`${SHEETS_ENDPOINT}/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueRenderOption=UNFORMATTED_VALUE&key=${API_KEY}`, init).then(r => r.json());
}

export async function updateGrade(course, assignment, student, newGrades) {
    const init = {
        method: 'PUT',
        headers: { Authorization: `Bearer ${CANVAS_TOKEN}` },
        body: newGrades.reduce((form, [k, v]) => (form.append(k, v), form), new FormData())
    };
    return fetch(`${CANVAS_ENDPOINT}/api/v1/courses/${course}/assignments/${assignment}/submissions/${student}`, init).then(r => r.json());
}

export async function addComments(course, assignment, student, comments) {
    return Promise.all(comments.map(comment => updateGrade(course, assignment, student, [['comment[text_comment]', comment]])));
}

export async function deleteComment(course, assignment, student, comment) {
    const init = {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${CANVAS_TOKEN}` }
    };
    return fetch(`${CANVAS_ENDPOINT}/api/v1/courses/${course}/assignments/${assignment}/submissions/${student}/comments/${comment}`, init).then(r => r.json());
}

