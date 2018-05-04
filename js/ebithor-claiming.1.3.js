/**
 * Version Notes: - DatabaseName information - force orcid logout during thor logout, so user must authenticate on orcid again
 * 
 * @author Guilherme Formaggio
 * 
 */

var thorApplicationNamespace = {};

// Variable to store data with user information after the user logon
thorApplicationNamespace.userData = '';

// Variable to store the claiming information, such as if is the user logged in,
// or has claimed the current dataset, so the application can react accordingly.
thorApplicationNamespace.claimingInfoData = '';

// Variable to store list of datasets to be claimed on batch
thorApplicationNamespace.orcIdWorkBatch = [];

// Variable to control the last error message returned
// and avoid recreate the same error again
thorApplicationNamespace.lastErrorTime = 0;

// ------------------------------------------------------------------------------
// CLIENT APP FEEDBACK NOTIFICATIONS
// ------------------------------------------------------------------------------
// Implement on client side a similar handler to be notified, as example:
// function clientEvent(event) {
// if (event.data == thorApplicationNamespace.notify.loadingComplete) ...
// }
// if (window.addEventListener) addEventListener("message", clientEvent, false)
// else attachEvent("onmessage", clientEvent)
// ------------------------------------------------------------------------------
thorApplicationNamespace.notify = {};

// Called after page is refreshed. Then check
// thorApplicationNamespace.claimingInfoData to get all user's status
thorApplicationNamespace.notify.loadingComplete = "thor.loading.complete";

// Called after processing error returned from Thor WS. Then check
// thorApplicationNamespace.errorReturned to get JSON error's description
thorApplicationNamespace.notify.errorOccurred = "thor.loading.error";

// Called when Thor WS is not available. Then check
// thorApplicationNamespace.errorReturned to get JSON error's description
thorApplicationNamespace.notify.fatalError = "thor.loading.fatalError";

// Called after the user clicks claim/batch claim link
thorApplicationNamespace.notify.claimStart = "thor.loading.claimStart";

// Called after the claim/batch claim WS returns with success, meaning datasets
// were added to user ORCID profile
thorApplicationNamespace.notify.claimEnd = "thor.loading.claimed";

// Called after the login/logout ORCID redirection's popup window is closed
thorApplicationNamespace.notify.popupClosed = "thor.popup.closed";

// Called when the user clicks the link to login thru ORCID authentication.
// PS:This ensures he clicked the login link only.
// Check thorApplicationNamespace.notify.loadingComplete
// after it to see user login status
thorApplicationNamespace.notify.loginClick = "thor.notify.login.click";

// Called when the user clicks the link to logout.
// PS:This ensures he clicked the logout link only.
// Check thorApplicationNamespace.notify.loadingComplete
// after it to see user login status
thorApplicationNamespace.notify.logoutClick = "thor.notify.logout.click";

// ------------------------------------------------------------------------------
// SERVER SETUP
// ------------------------------------------------------------------------------
// Thor Hub server info
// * Local
// if ("localhost" == location.hostname) {
//     thorApplicationNamespace.thorServer = "//localhost:8088";
//     thorApplicationNamespace.thorServerContext = "/ThorWeb";
//     thorApplicationNamespace.thorForceLogoutUrl = "//sandbox.orcid.org/userStatus.json?logUserOut=true";
// } else 
if ("www.ebi.ac.uk" == location.hostname) {
    thorApplicationNamespace.thorServer = "//www.ebi.ac.uk";
    thorApplicationNamespace.thorServerContext = "/europepmc/thor";
    thorApplicationNamespace.thorForceLogoutUrl = "//orcid.org/userStatus.json?logUserOut=true";
} else {
    thorApplicationNamespace.thorServer = "https://www.ebi.ac.uk";
    thorApplicationNamespace.thorServerContext = "/europepmc/hubthor";
    thorApplicationNamespace.thorForceLogoutUrl = "https://sandbox.orcid.org/userStatus.json?logUserOut=true";
}

// * Dev
// thorApplicationNamespace.thorServer = "http://wwwdev.ebi.ac.uk";
// thorApplicationNamespace.thorServerContext = "/europepmc/thorTest";
// thorApplicationNamespace.thorServer = "//ves-ebi-37.ebi.ac.uk:8080";
// thorApplicationNamespace.thorServerContext = "/europepmc/thorTest";
// thorApplicationNamespace.thorServer = "https://www.ebi.ac.uk";
// thorApplicationNamespace.thorServerContext = "/europepmc/hubthor";
//thorApplicationNamespace.thorForceLogoutUrl = "//sandbox.orcid.org/userStatus.json?logUserOut=true";

// * Prod
// thorApplicationNamespace.thorServer = "//www.ebi.ac.uk";
// thorApplicationNamespace.thorServerContext = "/europepmc/thor";
// thorApplicationNamespace.thorForceLogoutUrl = "//orcid.org/userStatus.json?logUserOut=true"; 

// ------------------------------------------------------------------------------
// WS ENDPOINTS
// ------------------------------------------------------------------------------
// Thor Hub Project WebService to get claiming information
thorApplicationNamespace.wsClaimingUrl = thorApplicationNamespace.thorServer
		+ thorApplicationNamespace.thorServerContext
		+ "/api/dataclaiming/claiming";

// Thor Hub Project WebService to claim new work
thorApplicationNamespace.wsAddWorkUrl = thorApplicationNamespace.thorServer
		+ thorApplicationNamespace.thorServerContext
		+ "/api/dataclaiming/claimWork";

// Thor Hub Project WebService to claim new work
thorApplicationNamespace.wsAddBatchWorkUrl = thorApplicationNamespace.thorServer
		+ thorApplicationNamespace.thorServerContext
		+ "/api/dataclaiming/claimWorkBatch";

// ------------------------------------------------------------------------------
// JS FUNCTIONS
// ------------------------------------------------------------------------------
/**
 * Query Web Service to load the claiming info, such as sign-in/out links,
 * username, information if the current dataset is claimed. Use a default
 * callback function to process the webservice results.
 * 
 */
thorApplicationNamespace.loadClaimingInfo = function(databaseName) {
	thorApplicationNamespace.registerOAuthClient(databaseName);
	thorApplicationNamespace
			.claimingInfo(thorApplicationNamespace.callbackloadClaiming);
}

/**
 * Register the client database connecting to Thor Hub Services. Some databases
 * may have their own oauth client set in the Hub.
 */
thorApplicationNamespace.registerOAuthClient = function(databaseName) {
	// If the variable has not yet been initialized...
	if (!thorApplicationNamespace.oauthclient) {
		if (databaseName && databaseName != '')
			// ...initialized with parameter if it is not empty
			thorApplicationNamespace.oauthclient = databaseName;
		else
			// ...or initialize with default value if empty
			thorApplicationNamespace.oauthclient = 'DEFAULT';
	}
}

/**
 * Creates an object representing the current dataset. title: Work/dataset Title
 * workType: type of ORCID work, ie, publication, dataset... publicationYear:
 * Work/dataset publication year url: Work/dataset public url description:
 * Work/dataset abstract description databaseName: Database who manages this
 * work/dataset, ie, PDB, Biostudies, Metabolights, ...
 */
thorApplicationNamespace.createWorkOrcId = function(title, workType,
		publicationYear, url, description, databaseName) {
	thorApplicationNamespace.orcIdWork = {
		title : title,
		workType : workType,
		publicationYear : publicationYear,
		workExternalIdentifiers : [],
		url : url,
		shortDescription : description,
		clientDbName : databaseName
	};
}

/**
 * Initialize variable that holds the list of datasets for batch claiming
 */
thorApplicationNamespace.cleanBatchList = function() {
	thorApplicationNamespace.orcIdWorkBatch = [];
}

/**
 * Creates an object representing the current dataset and add it to the list of
 * objects that will be claimed on batch. title: Work/dataset Title workType:
 * type of ORCID work, ie, publication, dataset... publicationYear: Work/dataset
 * publication year url: Work/dataset public url description: Work/dataset
 * abstract description databaseName: Database who manages this work/dataset,
 * ie, PDB, Biostudies, Metabolights, ... externalIdType: type of identifier
 * externalId: identifier value
 */
thorApplicationNamespace.addWorkOrcIdToBatch = function(title, workType,
		publicationYear, url, description, databaseName, externalIdType,
		externalId) {
	// creates an object to represent the dataset being claimed
	var tmpOrcIdWork = {
		title : title,
		workType : workType,
		publicationYear : publicationYear,
		workExternalIdentifiers : [ {
			workExternalIdentifierType : externalIdType,
			workExternalIdentifierId : externalId
		} ],
		url : url,
		shortDescription : description,
		clientDbName : databaseName
	};

	// adds the dataset to the batch claim list
	thorApplicationNamespace.orcIdWorkBatch.push(tmpOrcIdWork);
}

/**
 * Removes an object from the list of objects that will be claimed on batch.
 * externalIdType: type of identifier externalId: identifier value
 */
thorApplicationNamespace.removeWorkOrcIdFromBatch = function(externalIdType,
		externalId) {
	// Creates a work object refering the identifier that will be removed from
	// the batch claiming list
	var orcIdWorkRemove = {
		workExternalIdentifiers : [ {
			workExternalIdentifierType : externalIdType,
			workExternalIdentifierId : externalId
		} ]
	}

	// Check all works from the batch claim list to remove the one that should
	// not me claimed anymore
	for (var i = 0; i < thorApplicationNamespace.orcIdWorkBatch.length; i++) {
		if (thorApplicationNamespace.isWorkEquals(
				thorApplicationNamespace.orcIdWorkBatch[i], orcIdWorkRemove)) {
			thorApplicationNamespace.orcIdWorkBatch.splice(i, 1);
			break;
		}
	}

}

/**
 * Check if two OrcIdWork objects have the same identifier value and type.
 */
thorApplicationNamespace.isWorkEquals = function(obj1, obj2) {
	var objsEqual = false;
	// Checks if both objects identifiers exist
	if (obj1 && obj2 && obj1.workExternalIdentifiers
			&& obj2.workExternalIdentifiers) {
		// Checks if object's ID are equal
		if ((obj1.workExternalIdentifiers[0].workExternalIdentifierType == obj2.workExternalIdentifiers[0].workExternalIdentifierType)
				&& (obj1.workExternalIdentifiers[0].workExternalIdentifierId == obj2.workExternalIdentifiers[0].workExternalIdentifierId)) {
			objsEqual = true;
		}
	}
	return objsEqual;
}

/**
 * Adds an Identifier to the current dataset.
 * 
 */
thorApplicationNamespace.addWorkIdentifier = function(externalIdType,
		externalId) {
	// Create object representing the identifier
	var workExternalIdentifier = {
		workExternalIdentifierType : externalIdType,
		workExternalIdentifierId : externalId
	}

	// Associates the identifier to current dataset
	if (thorApplicationNamespace.orcIdWork != '') {
		thorApplicationNamespace.orcIdWork.workExternalIdentifiers
				.push(workExternalIdentifier);
	}
}

/**
 * Operation to specify a function to be called when the user clicks to run the
 * batch claiming button.
 * 
 */
thorApplicationNamespace.addBatchClaimFunction = function(customFcn) {
	thorApplicationNamespace.batchClaimFunction = customFcn;
}

/**
 * Query Web Service to load the claiming information, such as sign-in/out
 * links, username, information if the current dataset is claimed.
 * 
 * @param callback
 *            Funcion to be called after the webservice retrives the claiming
 *            information and to process its resuls
 * 
 */
thorApplicationNamespace.claimingInfo = function(callback) {
	var url = thorApplicationNamespace.wsClaimingUrl;
	if (url != "") {
		url = thorApplicationNamespace.buildUrl(url, "clientAddress",
				thorApplicationNamespace.getServerNamePort())
	}
	// To load the claiming information we only need the dataset Id
	// and avoid sending long fields such as description.
	var orcIdWorkAux = {};
	if (thorApplicationNamespace.orcIdWork) {
		orcIdWorkAux = {
			workExternalIdentifiers : thorApplicationNamespace.orcIdWork.workExternalIdentifiers
		};
	}
	thorApplicationNamespace.sendGetWS(url, callback, JSON
			.stringify(orcIdWorkAux));
}

/**
 * Call the Web Service to add current dataset to user ORCID profile
 * 
 */
thorApplicationNamespace.addWork = function() {
	thorApplicationNamespace.callWS(thorApplicationNamespace.wsAddWorkUrl,
			thorApplicationNamespace.claimCallback, JSON
					.stringify(thorApplicationNamespace.orcIdWork), 'POST',
			'json');
}

/**
 * Call the Web Service to batch claim datasets to user ORCID profile
 * 
 */
thorApplicationNamespace.addBatchWork = function() {
	// Checks if the integration application created a function
	// to manage the dataset list to be on batch claim.
	if (thorApplicationNamespace.batchClaimFunction != null) {
		// Runs the function to add datasets to the batch claim list
		thorApplicationNamespace.batchClaimFunction();
	}

	// Creates an object to wrap the list of datasets on the batch claim
	var batchParams = {};
	batchParams.orcIdWorkLst = thorApplicationNamespace.orcIdWorkBatch;

	// Calls the Thor Hub service to realize the batch claiming
	thorApplicationNamespace.callWS(thorApplicationNamespace.wsAddBatchWorkUrl,
			thorApplicationNamespace.claimCallback,
			JSON.stringify(batchParams), 'POST', 'json');
}

/**
 * Callback function after the claim/batch claim are executed with sucess. It
 * notifies the client app that claim is done and refreshes page to reflect
 * claimed datasets.
 */
thorApplicationNamespace.claimCallback = function() {
	// Notify client app that claim is done
	thorApplicationNamespace
			.notifyClientApp(thorApplicationNamespace.notify.claimEnd);
	// Reloads page to view claimed data
	thorApplicationNamespace.loadClaimingInfo();
}

/**
 * True if user had logged in, false if not.
 * 
 */
thorApplicationNamespace.isSignedIn = function() {
	var data = thorApplicationNamespace.claimingInfoData;
	return data['isUserLoggedIn'];
}

/**
 * True if current dataset is already claimed to user ORCID, false if not.
 * 
 */
thorApplicationNamespace.isCurrentDatasetClaimed = function() {
	var data = thorApplicationNamespace.claimingInfoData;
	return data['isDataClaimed'];
}

/**
 * Function to check is a dataset exists in the user's ORCID profile. Must be
 * used only after user is logged in
 */
thorApplicationNamespace.isDatasetClaimed = function(datasetType, datasetId) {
	try {
		// Loops thru all user works...
		var numWorks = thorApplicationNamespace.claimingInfoData.orcIdRecord.works.length;
		for (var i = 0; i < numWorks; i++) {
			// Loops thru all identifier of each work
			var numWorkIdentifiers = thorApplicationNamespace.claimingInfoData.orcIdRecord.works[i].workExternalIdentifiers.length;
			for (var j = 0; j < numWorkIdentifiers; j++) {
				tmpWorkId = thorApplicationNamespace.claimingInfoData.orcIdRecord.works[i].workExternalIdentifiers[j].workExternalIdentifierId;
				tmWorkType = thorApplicationNamespace.claimingInfoData.orcIdRecord.works[i].workExternalIdentifiers[j].workExternalIdentifierType;
				// If dataset identifier exists, return true
				if (datasetId == tmpWorkId && datasetType == tmWorkType)
					return true;
			}
		}
	} catch (err) {
	} // err can happen if user is not logged in or dont have any work claimed
	// dataset id not found on user's works
	return false;
}

/**
 * Return the client application information in the format:
 * PROTOCOL://SERVER:PORT This client address is used for callback functions and
 * CORS security enabling
 * 
 */
thorApplicationNamespace.getServerNamePort = function() {
	var url = window.location.href
	var arr = url.split("/");
	var result = arr[0] + "//" + arr[2]
	return result;
}

/**
 * Return the login url added with the parameters: remind=true, if the user
 * selected the remind me checkbox clientAddress=protocol://server, for the
 * client information
 * 
 */
thorApplicationNamespace.getLoginUrl = function() {
	var data = thorApplicationNamespace.claimingInfoData;
	var url = data['loginUrl'];
	// adds remember me checked to loginlink
	if ($('.thor_checkbox_rememberMe_cookie').is(':checked')) {
		url = thorApplicationNamespace.buildUrl(url, "remind", "true");
	}
	// Add client server name + port to login URL so the javascript from server
	// can communicate via postMessage
	// with the javascript from client.
	if (url != "") {
		url = thorApplicationNamespace.buildUrl(url, "clientAddress",
				thorApplicationNamespace.getServerNamePort())
	}
	return url;
}

/**
 * Return the logout url added with the parameters: remind=false, to remove the
 * remember me cookie clientAddress=protocol://server, for the client
 * information
 * 
 */
thorApplicationNamespace.getLogoutUrl = function() {
	var data = thorApplicationNamespace.claimingInfoData;
	var url = data['logoutUrl'];
	// Add client server name + port to login URL so the javascript from server
	// can communicate via postMessage
	// with the javascript from client.
	if (url != "") {
		url = thorApplicationNamespace.buildUrl(url, "remind", "false"); // remove
		// remind
		// me
		// cookie
		url = thorApplicationNamespace.buildUrl(url, "clientAddress",
				thorApplicationNamespace.getServerNamePort());
	}
	return url;
}

/**
 * Return the user name from ORCID record
 * 
 */
thorApplicationNamespace.getUserName = function() {
	var data = thorApplicationNamespace.claimingInfoData;
	if (data['orcIdRecord'] != null) {
		return data['orcIdRecord']['name'];
	}
}

/**
 * Function to call a Rest Web Service at the endpoint and invoke the callback
 * function to process the results passing the json string returned from WS as
 * function parameter.
 * 
 */
thorApplicationNamespace.callWS = function(endpoint, callback, myData,
		sendType, sendDataType) {
	$
			.ajax({
				url : endpoint,
				crossDomain : true,
				xhrFields : {
					withCredentials : true
				},
				type : sendType,
				beforeSend : function(request) {
					request.setRequestHeader("oauthclient",
							thorApplicationNamespace.oauthclient);
				},
				data : myData,
				contentType : 'application/json',
				dataType : sendDataType,
				success : function(data) {
					callback(data);
				},
				error : function(jqXHR, error, errorThrown) {
					// Error information returned by the server
					if (jqXHR.status && jqXHR.status == 422) {
						// saves returned error so client can check
						thorApplicationNamespace.errorReturned = jqXHR.responseJSON;
						// notify client about error
						thorApplicationNamespace
								.notifyClientApp(thorApplicationNamespace.notify.errorOccurred);
						
						//Check time to not create more than 1 error per second
						var now = new Date().getTime();
						var diff = now - thorApplicationNamespace.lastErrorTime;
						thorApplicationNamespace.lastErrorTime = now;
						if (diff > 1000) {
							// Reloads page to view claimed data
							thorApplicationNamespace.loadClaimingInfo();
						}
					} else {
						// saves returned error so client can check
						thorApplicationNamespace.errorReturned = error;
						// notify client about error
						thorApplicationNamespace
								.notifyClientApp(thorApplicationNamespace.notify.fatalError);
					}
				},
			});
}

/**
 * Receives the data response from the webservice and call distinct funcions
 * that will make use of this data to control the claiming box displayed.
 * 
 * @param data
 *            Response from Web Service that retrieves claiming info
 * 
 */
thorApplicationNamespace.callbackloadClaiming = function(data) {
	if (data != null && data != "") {
		// *********************************************************
		// Makes USER ORCID REGISTRY available to JS functions
		// *********************************************************
		thorApplicationNamespace.claimingInfoData = data;
		// *********************************************************

		thorApplicationNamespace.userData = data.orcIdRecord;
		// update objects based on Thor info
		thorApplicationNamespace.loadLinks();
		thorApplicationNamespace.loadUserName();
		thorApplicationNamespace.setClaimedMessage();
		thorApplicationNamespace.displayClaimBox();
		// notify client app about response status
		thorApplicationNamespace
				.notifyClientApp(thorApplicationNamespace.notify.loadingComplete);
	}
}

/**
 * Post a message notifying the client application that the user status
 * information(isLoggedIn, has claimed dataset) was just loaded
 */
thorApplicationNamespace.notifyClientApp = function(notifyType) {
	window.postMessage(notifyType, "*");
}

/**
 * Show/hide the label message asking the user to claim a dataset or label
 * informing that it is already claimed
 * 
 */
thorApplicationNamespace.setClaimedMessage = function() {
	if (thorApplicationNamespace.isCurrentDatasetClaimed()) {
		$('.thor_div_showIf_datasetNotClaimed').hide();
		$('.thor_div_showIf_datasetAlreadyClaimed').show();
	} else {
		$('.thor_div_showIf_datasetAlreadyClaimed').hide();
		$('.thor_div_showIf_datasetNotClaimed').show();
	}
}

/**
 * Display the claiming box for authenticated/non-authenticated user.
 * 
 */
thorApplicationNamespace.displayClaimBox = function() {
	if (thorApplicationNamespace.isSignedIn()) {
		$('.thor_div_showIf_notSigned').hide();
		$('.thor_div_showIf_signedIn').show();
	} else {
		$('.thor_div_showIf_notSigned').show();
		$('.thor_div_showIf_signedIn').hide();
	}
}

/**
 * Load the username in the field labeled with thor_label_show_userName class.
 * 
 */
thorApplicationNamespace.loadUserName = function() {
	$('.thor_label_show_userName').empty();
	$('.thor_label_show_userName').append(
			thorApplicationNamespace.getUserName());
}

/**
 * Loads the links for login, logout and claiming from the Thor WS Response.
 * 
 */
thorApplicationNamespace.loadLinks = function() {
	// Load LOGIN LINK Url
	if ($('.thor_a_generate_signinLink').length) {
		$('.thor_a_generate_signinLink').unbind("click");
		$('.thor_a_generate_signinLink')
				.click(
						function(e) {
							// Notify client app that user clicked login link
							thorApplicationNamespace
									.notifyClientApp(thorApplicationNamespace.notify.loginClick);
							e.preventDefault(); // this will prevent the browser
							// to redirect to
							// the href
							// if js is disabled nothing should change and the
							// link will work
							// normally
							var url = thorApplicationNamespace.getLoginUrl();
							var windowName = "ORCID";
							window
									.open(url, windowName,
											"height=900,width=800");
						});
	}

	// Load LOGOUT LINK Url
	if ($('.thor_a_generate_logoutLink').length) {
		$('.thor_a_generate_logoutLink').unbind("click");
		$('.thor_a_generate_logoutLink')
				.click(
						function(e) {
							e.preventDefault(); // this will prevent the browser
							// to redirect to
							// the href
							var r = confirm("Are you sure you want to log out?");
							if (r == true) {
								// Notify client app that user clicked logout
								// link
								thorApplicationNamespace
										.notifyClientApp(thorApplicationNamespace.notify.logoutClick);
								// if js is disabled nothing should change and
								// the link will
								// work normally
								var url = thorApplicationNamespace
										.getLogoutUrl();
								var windowName = "ORCID";
								window.open(url, windowName,
										"height=50,width=50");
								
								//Sign out the user from OrcId website authentication
								thorApplicationNamespace.callWSJsonP(thorApplicationNamespace.thorForceLogoutUrl, null, null)
							}
						});
	}

	// Load CLAIM LINK link
	if ($('.thor_a_generate_claimLink').length) {
		$('.thor_a_generate_claimLink').unbind("click");
		$('.thor_a_generate_claimLink')
				.click(
						function(e) {
							e.preventDefault(); // this will prevent the browser
							// to redirect to
							// the href
							var r = confirm("Do you want to claim this data to your ORCID?");
							if (r == true) {
								// Notify client app that dataset claim has
								// started
								thorApplicationNamespace
										.notifyClientApp(thorApplicationNamespace.notify.claimStart);
								// Claim dataset to user orcid
								thorApplicationNamespace.addWork();
							}
						});
	}

	// Load BATCH CLAIM LINK link
	if ($('.thor_a_generate_batchClaimLink').length) {
		$('.thor_a_generate_batchClaimLink').unbind("click");
		$('.thor_a_generate_batchClaimLink')
				.click(
						function(e) {
							e.preventDefault(); // this will prevent the browser
							// to redirect to the href
							var r = confirm("Do you want to claim these records to your ORCID?");
							if (r == true) {
								// Notify client app that batch claim has
								// started
								thorApplicationNamespace
										.notifyClientApp(thorApplicationNamespace.notify.claimStart);
								// run batch claiming
								thorApplicationNamespace.addBatchWork();
							}
						});
	}
}

/**
 * Function to call a Rest Web Service at the endpoint and invoke the callback
 * function to process the results passing the json string returned from WS as
 * function parameter.
 * 
 */
thorApplicationNamespace.sendGetWS = function(endpoint, callback, myData) {
	var serviceUrl = thorApplicationNamespace.buildUrl(endpoint,
			"ordIdWorkJson", myData);
	thorApplicationNamespace.callWS(serviceUrl, callback, '', 'GET', 'json');
}

/**
 * Function to call a Rest Web Service with jsonp at the endpoint and invoke 
 * the callback function to process the results .
 */
thorApplicationNamespace.callWSJsonP= function(endpoint, onSuccess, onError) {
	var serviceUrl = endpoint;
	$.ajax({
	    url: serviceUrl,
	    dataType: 'jsonp',
	    success : function(result,status,xhr) {
			if (onSuccess != null) {
				onSuccess(result,status,xhr);
			}
		},
	    error: function (xhr, status, error) {
	    	if (onError != null) {
	    		onError(xhr, status, error);
			}
	    }
	});	
}

/**
 * Addes a key/value parameter to the base url.
 * 
 */
thorApplicationNamespace.buildUrl = function(base, key, value) {
	var sep = (base.indexOf('?') > -1) ? '&' : '?';
	return base + sep + key + '=' + value;
}

/**
 * Listener function to be invoked after the ORCID login popup closes. It is
 * used to refresh the page displayed information after the user authenticates.
 * 
 */
thorApplicationNamespace.thorListener = function(event) {
	if (thorApplicationNamespace.notify.popupClosed == event.data) {
		thorApplicationNamespace.loadClaimingInfo();
	}
}

/**
 * Get a parameter from the URL
 */
thorApplicationNamespace.getParameterByName = function(name, url) {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex
			.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Register the listener function on the webpage
 * 
 */
if (window.addEventListener) {
	addEventListener("message", thorApplicationNamespace.thorListener, false)
} else {
	attachEvent("onmessage", thorApplicationNamespace.thorListener)
}