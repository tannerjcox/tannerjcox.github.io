$(function () {
    var USBscanCallbacks = {
        receiving: function (id) {
            if ($('#scan_quote').hasClass('active')) {
                var url = '/admin/pending-items/' + id + '/preview';
                $.get(url)
                    .done(function (response) {
                        renderModal(response);
                        $('#remoteModal .superbox').SuperBox();
                        $('div.superbox-list:first').trigger("click");
                        fillSupplierInfo($('#supplier_id').val());
                    });
            }
            if ($('#scan_supplier').hasClass('active')) {
                $('.supplier-info').show();
                fillSupplierInfo(id);
            }
        },
        review: function (id) {
            window.location.href = '/admin/products/review/' + id;
        }
    };

    $(document).scannerDetection(function (data) {
        var id = data.substring(1, data.length - 1);
        getScannerCallback()(Number(id).toString());
    });

    function getScannerCallback() {
        var callbackName = $('[name=scannerCallback]').val();

        return USBscanCallbacks[callbackName];
    }

    if ($('#printNewTag').length) {
        window.open('/admin/products/' + $('#printNewTag').val() + '/price-tag', 'price_tag', 'width=150, height=450, addressbar=1, left=400, top=0');
    }

    var $shipsWith = $('#ships_with');

    $('.comes-with').change(function (event) {
        if ($(this).prop('checked')) {
            if ($shipsWith.val() != '') {
                $shipsWith.val($shipsWith.val() + ', ' + $(this).val());
            } else {
                $shipsWith.val($(this).val());
            }
        } else {
            var comesWithString = $shipsWith.val();
            $shipsWith.val(comesWithString.replace($(this).val(), ''));
        }
        if ($shipsWith.val().substr($shipsWith.val().length - 2) == ', ') {
            $shipsWith.val($shipsWith.val().substr(0, $shipsWith.val().length - 2))
        }
        if ($shipsWith.val().substr(0, 2) == ', ') {
            $shipsWith.val($shipsWith.val().substr(2, $shipsWith.val().length))
        }
        $shipsWith.val($shipsWith.val().replace(', , ', ', '));

        event.stopPropagation();
    });

    if ($.cookie('receiving_scan_type') == 'scan_supplier') {
        $('#scan_quote').removeClass('active').removeClass('btn-primary');
        $('#scan_supplier').addClass('active').addClass('btn-primary');
    }
    $('#scan_quote').on('click', function () {
        $.cookie('receiving_scan_type', 'scan_quote');
        $('#scan_quote').addClass('btn-primary');
        $('#scan_supplier').removeClass('btn-primary');
    });
    $('#scan_supplier').on('click', function () {
        $.cookie('receiving_scan_type', 'scan_supplier');
        $('#scan_quote').removeClass('btn-primary');
        $('#scan_supplier').addClass('btn-primary');
    });

    var $name = $('#title');
    var originalName = $name.val();
    var offer = parseInt($('#offer').text());
    var quoteStorePrice = parseInt($('#quote_store_price').text());
    var $purchasePrice = $('#purchase_price');
    var $storePrice = $('#price');
    var $priceMessage = $('div.price_message');
    var $saveButton = $('.update-product');
    var originalButtonText = $saveButton.html();
    var buttonText;
    var $consignmentEmail = $('[name=send_store_price_email]');

    $consignmentEmail.change(function () {
        if ($saveButton.first().text() != 'Return to Supplier' && $(this).is(':checked')) {
            $saveButton.html('Save & Email Supplier');
        } else if ($saveButton.first().text() != 'Return to Supplier') {
            $saveButton.html(originalButtonText);
        }
        buttonText = ($(this).is(':checked')) ? 'Save & Email Supplier' : null;
    });

    $storePrice.change(function () {
        if (quoteStorePrice > $(this).val() && !$('[data-buyout]').data('is-buyout')) {
            $('.store_price_message').show();
            $('#store_price_message').prop('disabled', false);
        } else {
            $('.store_price_message').hide();
            $('#store_price_message').prop('disabled', true);
        }
    });

    $purchasePrice.change(function () {
        var updatedPrice = $purchasePrice.val();
        if (((offer - updatedPrice) / offer) > 0.2) {
            Messenger().post({
                message: 'Please talk to your team lead about making this price change'
            });
            markAsPriceChange();
        } else if (offer == $(this).val()) {
            $saveButton.html(originalButtonText);
            buttonText = '';
            $priceMessage.hide().val('');
            $('#price_message').attr('disabled', true);
        } else {
            markAsPriceChange();
        }
    });

    $name.on('change', function () {
        onTitleChange(originalName);
    });

    var $options = $('[name="review_options"]');
    var saveDisabled = $saveButton.is(":disabled");
    $options.change(function () {
        switch ($(this).attr('id')) {
            case 'return_to_supplier':
                $saveButton.html('Return to Supplier').addClass('btn-danger').removeClass('btn-primary').attr('disabled', false);
                if (!$('[data-buyout]').data('is-buyout')) {
                    $('[data-buyout]').hide();
                    $('#purchase_price').attr('disabled', true);
                }
                $('#is_return_to_supplier').show();
                break;
            case 'approve':
                $saveButton.html(buttonText ? buttonText : originalButtonText).addClass('btn-primary').removeClass('btn-danger').attr('disabled', saveDisabled);
                if (!$('[data-buyout]').data('is-buyout')) {
                    $('[data-buyout]').hide()
                    $('#purchase_price').attr('disabled', true);
                }
                $('#is_return_to_supplier').hide();
                break;
            case('convert_to_outlet'):
                $saveButton.html(buttonText ? buttonText : originalButtonText).addClass('btn-primary').removeClass('btn-danger').attr('disabled', saveDisabled);
                $('[data-buyout]').show();
                $('#purchase_price').attr('disabled', false);
                $('#is_return_to_supplier').hide();
                break;
        }
    });

    $('[name=state_selector]').select2({
        placeholder: 'Select a state'
    });
    $('#country').select2({
        placeholder: 'Select a country'
    });

    var $reference = $('[data-action=getReceivingReferenceItem]');
    $reference.on('click', function () {
        $(this).attr('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> ');
        $options.attr('checked', false).parent().removeClass('checked');
        targetId = $(this).data('id');
        var $referenceId = $('[data-type=receiving_reference_product_id]');
            var id = $referenceId.val();
            if (id) {
                $.post('/admin/products/reference/' + id, {
                    _method: 'POST',
                    reviewId: targetId
                }).done(function (response) {
                    if (response != '') {
                        $('#referenceProductDetails').html(response);
                        var $name = $('#title');
                        var originalName = $name.val();
                        var $brand = $('#brand_id');
                        $saveButton.attr('disabled', false);
                        saveDisabled = false;
                        $reference.addClass('btn-primary').html("<i class='fa fa-check'></i>").attr('disabled', false);
                        Messenger().post({
                            message: 'Reference Item Found, Please review details and make necessary changes',
                            showCloseButton: true
                        });
                        $brand.select2({
                            placeholder: 'Please Select a Brand'
                        });
                        $brand.on('change', showAndHideSections);

                        $('.checkbox').on('click', function (e) {
                            e.preventDefault();
                            $(this).find('label').toggleClass('checked');
                        });
                        $name.on('change', function () {
                            onTitleChange(originalName);
                        });
                        $('[type=checkbox][checked=checked]').parent('label').addClass('checked');
                        $referenceId.val($('.reference_id').text());
                    } else {
                        failToFindReferenceItem();
                    }
                }, showAndHideSections);
            } else {
                failToFindReferenceItem();
            }
    });

    function failToFindReferenceItem() {
        $reference.removeClass('btn-primary').html("<i class='fa fa-copy'></i>").attr('disabled', false);
        Messenger().post({
            message: 'Product not found, please try a different product number',
            showCloseButton: true
        });
    }

    function fillSupplierInfo(id) {
        $.ajax({
            dataType: 'json',
            url: '/admin/users/' + id,
            method: 'GET'
        }).done(function (response) {
            addProduct.fillPreviousUserInfo(response);
        });
        $('[data-action=create-unquoted-product-for-supplier]').text('Create Unquoted Item for Supplier');
    }

    var showAndHideSections = function () {
        $('[data-section]').addClass('hidden');
        $('[data-toggle-section]:checked, [data-toggle-section]:selected').each(function (index, toggle) {
            var sections = $(toggle).data('toggle-section').split('|');
            $.each(sections, function (index, section) {
                $('[data-section*="' + section + '"]').removeClass('hidden');
            });
        });
    };

    var getCopiedValue = function (handleData) {
        $.post('/admin/get-copied', {
            _method: 'GET'
        }).done(function (response) {
            handleData(response.copy);
        });
    };

    function markAsPriceChange() {
        if ($saveButton.first().text() != 'Return to Supplier') {
            $saveButton.html('Save & Email Supplier');
        }
        buttonText = 'Save & Email Supplier';
        $priceMessage.show();
        $('#price_message').attr('disabled', false);
    }

    function onTitleChange(originalName) {
        var newName = $('#title').val();
        if (newName != originalName) {
            Messenger().post({
                message: 'Item title changed, please verify measurements & description.',
                showCloseButton: true
            });
            $('.measure').css('border-color', '#f35958');
            $('#receiving_description').css('border', '1px solid #f35958');
        } else {
            $('.measure').css('border-color', '#e5e9ec');
            $('#receiving_description').css('border', '1px solid #e5e9ec');
        }
    }

    if ($('[data-type=receiving_reference_product_id]').val()) {
        $('[data-action=getReceivingReferenceItem]').trigger("click");
    }
    if ($('[name=buyback_id]').val()) {
        $('[data-type=receiving_reference_product_id]').val($('[name=buyback_id]').val());
        $('[data-action=getReceivingReferenceItem]').trigger("click");
    }

    if($('select[name=buyback_product_id]').length) {
        $('[name=buyback_product_id]').on('change', addProduct.previousItemChangeHandler).trigger('change');
    }

    $skuType = $('[name=type]');
    $dropoff = $('[name=is_customer_dropoff]');
    $paid = $('[name=supplier_is_paid]');
    $auth = $('#authentic');
    $sku = $('#item-sku');
    sku = $sku.text();
    if(!sku) {
        sku = 'BW';
    }

    $skuType.on('change', updateAuthenticBox);
    $dropoff.on('change', updateSku);
    $paid.on('change', updateAuthenticBox);

    function updateAuthenticBox() {
        updateSku();
        if (!isPaid) {
            $auth.removeClass('hidden');
            $auth.find('[name=is_authentic]').prop('checked', true);
            $auth.find('label.control-label').addClass('checked');
        } else {
            $auth.addClass('hidden');
            $auth.find('[name=is_authentic]').prop('checked', false);
            $auth.find('label.control-label').removeClass('checked');
        }
    }

    function updateSku() {
        $selectedSkuType = $('[name=type]:checked');
        isDropoff = ($('[name=is_customer_dropoff]:checked').val() == 'Yes');
        isPaid = ($('[name=supplier_is_paid]:checked').val() == 'Yes');
        if ($selectedSkuType.val() == 'Consignment') {
            $sku.text(isDropoff ? 'CD' : 'CW');
        } else if ($selectedSkuType.val() == 'Buy Out') {
            $sku.text(isPaid ? 'BD' : 'BW');
        }  else if ($selectedSkuType.val() == 'Outlet item') {
            $sku.text('FO');
        } else if ($selectedSkuType.val() == 'Buy back') {
            $sku.text('BB');
        }
    }
});
