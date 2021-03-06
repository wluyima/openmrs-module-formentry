/*
 * OpenMRS InfoPath Common Script Functions
 *
 * This document defines common JScript functions to be shared
 * across various InfoPath forms to simplify the function calls
 * needed in the individual InfoPath forms.
 *
 * author:  Burke Mamlin, MD
 * created: February 1, 2006
 * version: 1.3
 *
 * 2010-04-14 (Jeremy) Added addRelationship() method
 * 2006-11-29 (Burke) Added selectLocation() method
 */

var SERVER_URL = "http://localhost:8080/openmrs";
var TASKPANE_URL = SERVER_URL + "/module/formentry/taskpane";
var SUBMIT_URL = SERVER_URL + "/moduleServlet/formentry/formUpload";
var PROBLEM_ADDED_ELEM = "problem_added";
var PROBLEM_RESOLVED_ELEM = "problem_resolved";

//==============================================================
// Delete row of a repeating table containing the event's source
// node. To call from click event use: deleteRow(eventObj)
//==============================================================
function deleteTableRow(eventObj) {
	// Delete row containing source node
	var parent = eventObj.Source.parentNode;
	parent.removeChild(eventObj.Source);
}

//===============================================================
// Navigate to an absolute URL within the taskpane.  If the 
// taskpane is not visible, it will be opened.
//===============================================================
function taskPaneNavigateToAbsoluteUrl(url) {
	var taskPane = XDocument.View.Window.TaskPanes.Item(0);
	taskPane.Visible = true;
	taskPane.HTMLDocument.parentWindow.location = url;
}

//===============================================================
// Navigate to a relative URL within the taskpane.  If the 
// taskpane is not visible, it will be opened.
//===============================================================
function taskPaneNavigateTo(url) {
	taskPaneNavigateToAbsoluteUrl(TASKPANE_URL + url);
}

//===============================================================
// Select a new diagnosis
//===============================================================
function selectNewDiagnosis() {
	taskPaneNavigateTo('/diagnosis.htm?mode=add');
}

//==============================================================
// Delete a new diagnosis from list
//==============================================================
function deleteNewProblem(eventObj) {
	// delete problem added
	var node = eventObj.Source;
	var newProbs = node.parentNode.selectNodes(PROBLEM_ADDED_ELEM);
	if (newProbs.length > 1) {
		deleteTableRow(eventObj);
	} else {
		node.selectSingleNode("value").text = "";
	}
}

//===============================================================
// Select a resolved diagnosis
//===============================================================
function selectResolvedDiagnosis() {
	taskPaneNavigateTo('/diagnosis.htm?mode=remove');
}

//==============================================================
// Delete a resolved diagnosis from list
//==============================================================
function deleteResolvedProblem(eventObj) {
	// delete problem resolved
	var node = eventObj.Source;
	var resolvedProbs = node.parentNode.selectNodes(PROBLEM_RESOLVED_ELEM);
	if (resolvedProbs.length > 1) {
		deleteTableRow(eventObj);
	} else {
		node.selectSingleNode("value").text = "";
	}
}

//===============================================================
// Select a provider
//===============================================================
function selectProvider() {
	taskPaneNavigateTo('/provider.htm');
}

//===============================================================
// Select a tribe
//===============================================================
function selectTribe() {
	taskPaneNavigateTo('/tribe.htm');
}

//===============================================================
// Select a location
//===============================================================
function selectLocation(nodePath) {
	taskPaneNavigateTo('/location.htm'
	+ (nodePath == null ? '' : '?nodePath=' + nodePath));
}

//===============================================================
// Select a generic answer
//===============================================================
function selectAnswer(nodePath) {
	var question = XDocument.DOM.selectSingleNode(nodePath);
    var questionConcept = question.getAttribute("openmrs_concept");
    var conceptId = questionConcept.split("^")[0];
	taskPaneNavigateTo('/conceptAnswer.htm?conceptId=' + conceptId
		+ '&nodePath=' + nodePath);
}

//===============================================================
// Add an offline (in-form only) relationship
//===============================================================
function addRelationship() {
	if (XDocument.DOM.selectSingleNode("//patient/patient_relationship") == null) {
		alert("Your schema does not include the PATIENT_RELATIONSHIPS element.");
		return;
	}
	var patientId = XDocument.DOM.selectSingleNode("//patient/patient.patient_id");
	if (patientId)
		patientId = patientId.text;
	taskPaneNavigateTo("/relationshipOffline.htm?patientId=" + patientId);
}

//===============================================================
// Submit form to server and close (if successful)
//===============================================================
// usage:
// 		submitAndClose(eventObj);
//		if (eventObj.ReturnStatus)
//			autoClose();
function submitAndClose(eventObj) {
	
	var err = XDocument.DOM.validate();
	if (err.errorCode != 0) {
		XDocument.UI.Alert("This form has errors. You cannot submit the form until you correct the errors.\nPlease check the form for errors and try again.\n\nERROR DETAILS:\n" + err.reason);
		eventObj.ReturnStatus = false;
		return;
	}

	// Create an XMLHTTP object for document transport.
	var objXmlHttp;
	try {
		objXmlHttp = new ActiveXObject("MSXML2.XMLHTTP");
	} catch (ex) {
		XDocument.UI.Alert("Could not create MSXML2.XMLHTTP object.\r\n" + ex.number + " - " + ex.description);

		// Exit with error
		eventObj.ReturnStatus = false;
		return;
	}

	// Post the XML document to strUrl.
	objXmlHttp.open("POST", SUBMIT_URL, false);
	try {
		objXmlHttp.send(XDocument.DOM.xml);
	} catch(ex) {
		XDocument.UI.Alert("Could not post (ASP) document to " + 
			SUBMIT_URL + "\r\n" + ex.number + " - " + ex.description);

		// Return with eventObj.ReturnStatus == false.
		return;
	}

	if (objXmlHttp.status == 200) {
		XDocument.UI.Alert("Form submitted successfully.");
		eventObj.ReturnStatus = true;
		return;
	} else {
		err = objXmlHttp.responseText;
		XDocument.UI.Alert(err);
		eventObj.ReturnStatus = false;
		return;
	}
}

function autoClose() {
    Application.ActiveWindow.Close(true);
}
