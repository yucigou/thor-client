function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

/**
 * Custom function to add each selected checkbox in to the Thor claiming list.
 * thorApplicationNamespace.addWorkOrcIdToBatch is called for each selected checkbox that is going to be claimed
 */
function addSelectedDatasets() {
    //Clean the list of items
    thorApplicationNamespace.cleanBatchList();
    //Add each selected checkbox to Thor claiming list
    $('input[name="chkdataset"]:checked')
        .each(
            function() {
                for (var x = 0; x < appDatasetArray.length; x++) {
                    if (appDatasetArray[x].workExternalIdentifiers[0].workExternalIdentifierId == this.value) {
                        //Add the datasets the user checked to the list of datasets that Thor must claim
                        thorApplicationNamespace
                            .addWorkOrcIdToBatch(
                                appDatasetArray[x].title,
                                appDatasetArray[x].workType,
                                appDatasetArray[x].publicationYear,
                                appDatasetArray[x].url,
                                appDatasetArray[x].shortDescription,
                                appDatasetArray[x].clientDbName,
                                appDatasetArray[x].workExternalIdentifiers[0].workExternalIdentifierType,
                                appDatasetArray[x].workExternalIdentifiers[0].workExternalIdentifierId);

                    }
                }
            });
}

/**
 * Register the custom function in Thor. This will be invoked before claiming is sent.
 */
thorApplicationNamespace.addBatchClaimFunction(addSelectedDatasets);

/**
 * Array to store the list of datasets to be displayed on the current page.
 */
appDatasetArray = [];

//Add dataset detais to list
function loadDataset(title, workType, publicationYear, url, description,
                     databaseName, externalIdType, externalId) {
    var aux = {
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

    appDatasetArray.push(aux);
}

//Hardecoded dataset list
loadDataset(
    'A metabolomic study of urinary changes in type 2 diabetes in human compared to the control group',
    'data-set', '2012', 'https://www.ebi.ac.uk/metabolights/MTBLS1',
    'Type 2 diabetes mellitus is the result of a combination of impaired insulin secretion with reduced insulin sensitivity of target tissues. There are an estimated 150 million affected individuals worldwide, of whom a large proportion remains undiagnosed because of a lack of specific symptoms early in this disorder and inadequate diagnostics. In this study, NMR-based metabolomic analysis in conjunction with uni- and multivariate statistics was applied to examine the urinary metabolic changes in Human type 2 diabetes mellitus patients compared to the control group. The human population were un medicated diabetic patients who have good daily dietary control over their blood glucose concentrations by following the guidelines on diet issued by the American Diabetes Association. Note: This is part of a larger study, please refer to the original paper below.',
    'METABOLIGHTS', 'other-id', 'MTBLS1');
loadDataset(
    'Crystal structure of a hemoglobin component V from Propsilocerus akamusi (pH7.0 coordinates)',
    'data-set', '2012', 'http://blabl2222a.com', ' description 2',
    'LOCALHOST', 'other-id', '3a5g2');
loadDataset(
    'Active and inhibited human catalase structures: ligand and NADPH binding and catalytic mechanism.',
    'data-set', '2013', 'http://blab233333la.com', ' description 3',
    'LOCALHOST', 'other-id', '1dgf2');
loadDataset(
    'Accommodation of insertions in helices: the mutation in hemoglobin Catonsville (Pro 37 alpha-Glu-Thr 38 alpha) generates a 3(10)-->alpha bulge.',
    'data-set', '2013', 'http://blab233333la.com', 'description 4',
    'LOCALHOST', 'other-id', '1bz02');
loadDataset(
    'Metabolomic Study of ESB Tomatoes.',
    'data-set', '2019', 'http://MTBLS73', 'Metabolomic Study of ESB Tomatoes',
    'LOCALHOST', 'other-id', '8wPWD');
loadDataset(
    'Metabolomic Study of ESB Tomatoes.',
    'data-set', '2019', 'http://MTBLS73', 'Metabolomic Study of ESB Tomatoes',
    'LOCALHOST', 'other-id', 'dSgjb');
loadDataset(
    'Metabolomic Study of ESB Tomatoes.',
    'data-set', '2019', 'http://MTBLS73', 'Metabolomic Study of ESB Tomatoes',
    'LOCALHOST', 'other-id', 'tZVl4');
loadDataset(
    'Metabolomic Study of ESB Tomatoes.',
    'data-set', '2019', 'http://MTBLS73', 'Metabolomic Study of ESB Tomatoes',
    'LOCALHOST', 'other-id', '6nZ8T');
loadDataset(
    'Metabolomic Study of ESB Tomatoes.',
    'data-set', '2019', 'http://MTBLS73', 'Metabolomic Study of ESB Tomatoes',
    'LOCALHOST', 'other-id', 'Ns7PL');
loadDataset(
    'Metabolomic Study of ESB Tomatoes.',
    'data-set', '2019', 'http://MTBLS73', 'Metabolomic Study of ESB Tomatoes',
    'LOCALHOST', 'other-id', 'Dq5qO');
loadDataset(
    'Metabolomic Study of ESB Tomatoes.',
    'data-set', '2019', 'http://MTBLS73', 'Metabolomic Study of ESB Tomatoes',
    'LOCALHOST', 'other-id', makeid());

/**
 * Clean table displaying datasets
 */
function hideDatasets() {
    $('#myTable').find("tr:gt(0)").remove();
}

/**
 * Check if has the user checked any dataset
 */
function isDatasetSelected() {
    var dsSelected = false;
    $('input[name="chkdataset"]:checked').each(function() {
        dsSelected = true;
    });

    return dsSelected;
}

/**
 * enable/disables the claim button depending if is there any dataset selected
 */
function enableDisableBtn() {
    $('#claimBtn').prop('disabled', !isDatasetSelected());
}

/**
 * Insert the dataset from parameter to the table row on the page
 */
function addDatasetRow(dsObject) {
    $('#myTable tr:last')
        .after(
            '<tr><td><input type="checkbox" name="chkdataset" onclick="javascript:enableDisableBtn()" value="'
            + dsObject.workExternalIdentifiers[0].workExternalIdentifierId
            + '" /></td><td>'
            + dsObject.workExternalIdentifiers[0].workExternalIdentifierId
            + '</td><td>' + dsObject.title + '</td></tr>');
}

/**
 * Function to get all datasets from the list and only added to the page those
 * that were still not claimed by the user
 */
function displayDatasets() {
    for (var x = 0; x < appDatasetArray.length; x++) {
        var externalIdType = appDatasetArray[x].workExternalIdentifiers[0].workExternalIdentifierType;
        var externalId = appDatasetArray[x].workExternalIdentifiers[0].workExternalIdentifierId;
        //Only adds datasets that were not claimed by the user yet
        if (!thorApplicationNamespace.isDatasetClaimed(externalIdType,
                externalId)) {
            addDatasetRow(appDatasetArray[x]);
        }
    }
    enableDisableBtn();
}

/**
 * Check events returned by the Thor application
 */
function clientEvent(event) {
    switch (event.data) {
        case thorApplicationNamespace.notify.loadingComplete: //Called after page refresh user data
            //Hide any claiming popup
            $('#myModal').modal('hide');
            //reloads datasets being displayed
            hideDatasets();
            //if the user is signed in
            if (thorApplicationNamespace.isSignedIn()) {
                //show datasets to claim
                displayDatasets();
            }
            break;
        case thorApplicationNamespace.notify.errorOccurred: //Called after error is returned from Thor
            //Display error message
            $('.errorMsgSection').show();
            break;
        case thorApplicationNamespace.notify.claimEnd: //Called after the claim is done into orcid record
            //Show success message
            $('.successSection').show();
            //hide claiming popup
            $('#myModal').modal('hide');
            break;
        case thorApplicationNamespace.notify.popupClosed:
            break;
        case thorApplicationNamespace.notify.claimStart:
            break;
        case thorApplicationNamespace.notify.loginClick:
            break;
        case thorApplicationNamespace.notify.logoutClick:
            break;
        default:
            break;
    }
}

/**
 * Function to log the user out
 */
function logout() {
    //Hide all messages
    $('.errorMsgSection').hide();
    $('.successSection').hide();
    //Logs user out
    var url = thorApplicationNamespace.getLogoutUrl();
    var windowName = "ORCID";
    window.open(url, windowName, "height=50,width=50");
    //Sign out the user from OrcId website authentication
    thorApplicationNamespace.callWSJsonP(thorApplicationNamespace.thorForceLogoutUrl, null, null)
    //Closes logout popup
    $('#myModalLogout').modal('toggle');
}

/**
 * When the user clicks on claim button
 */
function submitBatch() {
    //Disables the claim button to avoid another claiming
    $('#btnSubmit').prop("disabled", true);
    //Show wait icon
    $('#imgLoading').show();
    //Call Thor to claim works
    thorApplicationNamespace.addBatchWork();
}

/**
 * Register event listeners to get Thor notifications
 */
if (window.addEventListener) {
    addEventListener("message", clientEvent, false)
} else {
    attachEvent("onmessage", clientEvent)
}