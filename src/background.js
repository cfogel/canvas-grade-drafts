import { CANVAS_ENDPOINT, DATA_RANGE, READABLE_RANGE } from "./config.js";
import { addRows, getRows, getSubmission, updateGrade, updateRows } from "./utils.js";

const emptyRubric = rubric => Object.keys(rubric).flatMap(k => [[`rubric_assessment[${k}][points]`,''],[`rubric_assessment[${k}][rating_id]`,''],[`rubric_assessment[${k}][comments]`,'']]);
const rubricToParams = rubric => Object.entries(rubric).flatMap(([key,{rating_id,comments,points}])=>[[`rubric_assessment[${key}][points]`,points],[`rubric_assessment[${key}][rating_id]`,rating_id],[`rubric_assessment[${key}][comments]`,comments]]);

chrome.runtime.onInstalled.addListener(details => {
    chrome.action.disable();
    chrome.declarativeContent.onPageChanged.removeRules(undefined,() => {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({pageUrl: {
                urlPrefix: CANVAS_ENDPOINT, 
                pathSuffix: "gradebook/speed_grader",
                queryPrefix: "assignment_id",
                queryContains: "student_id"
            }})],
            actions: [new chrome.declarativeContent.ShowAction()]
        }]);
    });
});

chrome.commands.onCommand.addListener(commandListener);

chrome.runtime.onConnect.addListener(async port => {
    if (port.sender.url == (await chrome.action.getPopup({}))) {
        port.onMessage.addListener(msg => commandListener(...msg))
    }
});

async function saveData(tab) {
    const [,courseId,assignmentId,studentId] = /\/courses\/(\d+)\/gradebook\/speed_grader\?assignment_id=(\d+)&student_id=(\d+)/.exec(tab.url);
    const data = await getSubmission(courseId,assignmentId,studentId,['rubric_assessment', 'submission_comments', 'course', 'assignment', 'user']);

    const { attempt, grade, submission_comments, rubric_assessment, grader_id, graded_at, course: {name:courseName}, assignment: {name:assignmentName}, user: {name:studentName} } = data;

    var { token } = await chrome.identity.getAuthToken({interactive: true});

    /* Spreadsheet fields:
        course | assignment | student | (attempt) | grade | (comments from grader) | rubric | (grader) | grading timestamp | loaded 
    */

    const [newDataRow,newReadableRow] = await Promise.all([
        addRows(token, DATA_RANGE, [courseId, assignmentId, studentId, attempt, grade, JSON.stringify(submission_comments.filter(({author_id}) => author_id == grader_id).map(({comment}) => comment)), JSON.stringify(rubric_assessment), grader_id, graded_at, false]), 
        addRows(token, READABLE_RANGE, [courseName, assignmentName, studentName, attempt, grade, JSON.stringify(submission_comments.filter(({author_id}) => author_id == grader_id).map(({comment}) => comment)), ...Object.values(rubric_assessment).flatMap(({points,comments})=>[points,comments]), grader_id, graded_at, false])
    ]);

    if (newDataRow?.updates?.updatedRows && newReadableRow?.updates?.updatedRows) {
        const newData = await updateGrade(courseId,assignmentId,studentId,emptyRubric(rubric_assessment));
    }
}

async function loadData(tab) {
    const [,courseId,assignmentId,studentId] = /\/courses\/(\d+)\/gradebook\/speed_grader\?assignment_id=(\d+)&student_id=(\d+)/.exec(tab.url);

    var { token } = await chrome.identity.getAuthToken({interactive: true});
    const { valueRanges: [{ values:dataRows, range:dataRowsRange },{ values:readableRows, range:readableRowsRange }] } = await getRows(token, DATA_RANGE, READABLE_RANGE);

    const data = dataRows.filter(([course,assignment,student,...rest]) => (course == courseId) && (assignment == assignmentId) && (student == studentId) && !rest.at(-1))
                     .toSorted((a,b)=>Date.parse(a.at(-2))-Date.parse(b.at(-2))).at(-1); // the most recent non-loaded row for the course/assignment/student

    const [,,,,grade,,rubric] = data;

    let newData = await updateGrade(courseId,assignmentId,studentId,[...rubricToParams(JSON.parse(rubric)), ['submission[posted_grade]',grade]]);
    if (newData.grade != grade) { // manual adjustments to rubric sums require a second API request
        newData = await updateGrade(courseId,assignmentId,studentId,[['submission[posted_grade]',grade]]);
    }

    const [,startSheetData,startColData,startRowData] = /^(\w+|'(?:[^']|'')+')!([A-Z]+)(\d+):/.exec(dataRowsRange);
    const loadedCellData = `${startSheetData}!${addColumnIndex(startColData,data.length-1)}${Number(startRowData)+dataRows.indexOf(data)}`;

    const [,startSheetReadable,startColReadable,startRowReadable] = /^(\w+|'(?:[^']|'')+')!([A-Z]+)(\d+):/.exec(readableRowsRange);
    const loadedCellReadable = `${startSheetReadable}!${addColumnIndex(startColReadable,readableRows[0].length-1)}${Number(startRowReadable)+readableRows.findIndex(r=>r.at(-2)==data.at(-2))}`;

    const [updatedRowData,updatedRowReadable] = await Promise.all([loadedCellData,loadedCellReadable].map(c=>updateRows(token,c,[true])));
}

function addColumnIndex(col,n) {
    const minChar = "A".charCodeAt();
    const maxOffset = "Z".charCodeAt() - minChar;

    const offset = col.at(-1).charCodeAt() - minChar;

    if (offset + n < (maxOffset+1)){
        return col.slice(0,-1) + String.fromCharCode(minChar + offset + n);
    }
    else {
        return (col.length == 1 ? addColumnIndex(String.fromCharCode(minChar),~~((offset + n)/(maxOffset+1))-1)
                                : addColumnIndex(col.slice(0,-1),~~((offset + n)/(maxOffset+1)))
               ) + String.fromCharCode(minChar + ((offset + n) % (maxOffset+1)));
    }
}

async function commandListener(command, tab) {
    try {
        switch (command) {
            case 'save-grade':
                await saveData(tab);
                await chrome.tabs.reload(tab.id);
                break;
            case 'load-grade':
                await loadData(tab);
                await chrome.tabs.reload(tab.id);
                break;
        }
    } catch (error) {
        console.log(error)
    }
}