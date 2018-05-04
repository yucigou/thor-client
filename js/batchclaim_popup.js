<!-- Load popup content dynamically -->
$('#myModal').on(
    'show.bs.modal',
    function() {
        $('#imgLoading').hide();
        $('#btnSubmit').prop("disabled", false);
        $('.errorMsgSection').hide();
        $('.successSection').hide();
        var dsListHtml = "";
        $('input[name="chkdataset"]:checked').each(function() {
            dsListHtml += "<p>" + this.value + "</p>"
        });
        $('#myModal').find('.modal-body').html(
            "<p>Do you want to claim the datasets to your ORCID Record?</p>"
            + dsListHtml);
    });