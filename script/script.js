$(function () {
    loadStartData();
    initErrorDialog();

    //при клике на свободную область скрывать список зон
    $(document).on('click', e => {
        if ($(e.target).closest(".result").length)
            return;
        $(".result").slideUp();
        e.stopPropagation();
    });

    //если курсор установлен, показывать весь список зон
    $('body').on('click', '.search__input', e => {
        $('.result').slideDown();
        return false;
    });

    //фильтр списка зон
    $('body').on('input', '.search__input', e => {
        let text = $('.search__input').val(), elementText;
        const zoneElements = $('.result__item');
        zoneElements.each((index, zone) => {
            elementText = $(zone).find('.result__name').text();
            if (elementText.search(new RegExp(`${text}`, 'gi')) < 0 && text != '') {
                $(zone).hide('slow');
            } else {
                if (text == '') {
                    elementText = tariffZones[index].name;
                } else {
                    elementText = tariffZones[index].name.replace(new RegExp(`(${text})`, 'gi'), `<strong>$1</strong>`);
                }
                $(zone).find('.result__name').html(elementText);
                $(zone).show('slow');
            }
        });
    });

    //клик по кнопке добавления зоны
    $('body').on('click', '.result__btn-add', e => {
        const selectedIndex = $(e.target).data('index');
        $(e.target).text('Удалить')
        $(e.target).removeClass('result__btn-add');
        $(e.target).addClass('result__btn-delete');

        $('.zone-list__msg').hide();
        $('.zone-list__btn').show();
        addNewZoneCard(selectedIndex);
    });

    //клик по кнопке удаления зоны в списке найденных зон
    $('body').on('click', '.result__btn-delete', e => {
        let selectedIndex = $(e.target).data('index');
        $(e.target).text('Добавить')
        $(e.target).removeClass('result__btn-delete');
        $(e.target).addClass('result__btn-add');

        deleteZoneCard(selectedIndex);
        errPopover.popover('hide');
    });

    //клик по кнопке удаления зоны в списке карточек для настроек
    $('body').on('click', '.zone-card__delete', e => {
        let selectedIndex = $(e.currentTarget).data('index');
        //вызываем событие клика, которое уже было реализовано при удалении из выпадающего списка
        $($('.result__btn')[selectedIndex]).trigger('click');
    });

    //клик по кнопке добавления наценки
    $('body').on('click', '.base-cost__add-extra', e => {
        let template = $('.extra-charge-template')[0];
        let clon = template.content.cloneNode(true);
        $(e.target).closest('.zone-card__body').append(clon);
    });

    //клик по кнопке удаления наценки
    $('body').on('click', '.extra-charge__delete', e => {
        $(e.target).closest('.extra-charge').remove();
        errPopover.popover('hide');
    });

    //вводим бозовую стоимость
    $('body').on('input', '.base-cost__input', e => {
        const changedCard = $(e.target).closest('.zone-card__body');
        const newBaseCost = $(e.target).val();
        const arrExtraChargeVal = changedCard.find('.extra-charge__cost-value');
        const totalVal = changedCard.find('.extra-charge__value');
        const validBase = validInputVal(newBaseCost, /^[0-9]*\.[0-9]{2}$/);//только цифры, символ "." и два знака после зяпятой)

        if (validBase) {
            makeValidInput($(e.target));
            arrExtraChargeVal.each((index, val) => {
                if ($(val).val() != '') {
                    $(totalVal[index]).text((Number($(val).val()) + Number(newBaseCost)).toFixed(2));
                }
            });
        } else {
            makeInvalidInput($(e.target));
        }
    });

    //вводим наценку
    $('body').on('input', '.extra-charge__cost-value', e => {
        const changedCard = $(e.target).closest('.zone-card__body');
        const newExtraCost = $(e.target).val();
        const baseCost = changedCard.find('.base-cost__input').val();
        const totalVal = $(e.target).closest('.extra-charge').find('.extra-charge__value');

        if (validInputVal(newExtraCost, /^\+[0-9]*\.[0-9]{2}$/) || validInputVal(newExtraCost, /^\-[0-9]*\.[0-9]{2}$/)) {
            makeValidInput($(e.target));
            if (baseCost != '') {
                $(totalVal).text((Number(newExtraCost) + Number(baseCost)).toFixed(2));
            }
        } else {
            makeInvalidInput($(e.target));
        }
    });

    //вводим одно из полей диапазона веса
    $('body').on('input', '.extra-charge__input-min, .extra-charge__input-max', e => {
        const newWeight = $(e.target).val();
        const validWeight = validInputVal(newWeight, /^[0-9]*\.[0-9]{3}$/);
        const minWeight = $(e.target).closest('.extra-charge').find('.extra-charge__input-min');
        const maxWeight = $(e.target).closest('.extra-charge').find('.extra-charge__input-max');

        if (validWeight) {
            makeValidInput($(e.target));
            if (Number($(minWeight).val()) > Number($(maxWeight).val())) {
                makeInvalidInput($(minWeight));
            } else {
                makeValidInput($(minWeight))
            }
        } else {
            makeInvalidInput($(e.target));
        }
    });

    //клик по кнопке сохранения
    $('body').on('click', '.zone-list__save-btn', e => {
        if (!$('.zone-card')) {
            $('.dialog__message').text('Доставка не настроенасок');
            modalDialog.dialog("open");
        } else {
            saveResultData();
        }
    });
});

let tariffZones = [], modalDialog, errPopover;

//загрузка данных и формирование списка зон
loadStartData = () => {
    $.ajax({
        method: "GET",
        url: "https://raw.githubusercontent.com/cscart/apply-for-job/master/frontend/developer/files/rate-areas.json",
        dataType: 'json'
    }).done(result => {
        tariffZones = result;

        const template = $('.result__item-template')[0];
        let clon;
        tariffZones.forEach((zone, index) => {
            clon = template.content.cloneNode(true);
            $(clon).find('.result__name').text(zone.name);
            $(clon).find('.result__btn').data({ 'index': index });
            $('.result').append(clon);
        });

        $('.loader').hide();
        $('.search, .zone-list').show();
    });
};

//настройка плагина модального окна для сообщений с ошибкой
initErrorDialog = () => {
    modalDialog = $('.dialog').dialog({
        modal: true,
        autoOpen: false,
        buttons: {
            Ok: function () {
                $(this).dialog("close");
            }
        }
    });
};

//добавляем новую карточку зоны для настройки
addNewZoneCard = index => {
    const template = $('.zone-card-template')[0];
    let clon = template.content.cloneNode(true);
    $(clon).find('.zone-card__name').text(tariffZones[index].name);
    $(clon).find('.zone-list__card').data({ 'index': index, 'name': tariffZones[index].name });
    $(clon).find('.zone-card__delete').data({ 'index': index });
    $('.zone-list__cards').append(clon);

    //работа плагина сортировки
    jplist.init();
    jplist.refresh();
};

//удаление карточки зоны из списка настраиваемых
deleteZoneCard = index => {
    const zoneCardList = $('.zone-card');
    for (let i = 0; i < zoneCardList.length; i++) {
        if ($(zoneCardList[i]).data('index') == index) {
            $(zoneCardList[i]).remove();
            zoneCardList.splice(i, 1);
            break;
        }
    }
    if (!zoneCardList.length) {
        $('.zone-list__msg').show();
        $('.zone-list__btn').hide();
    }
};

//валидация поля базовой стоимости
validInputVal = (val, regEx) => {
    let valid = false;
    valid = regEx.test(val);

    return valid;
};

//если введен неверный формат данных делать поле невалидным
makeInvalidInput = input => {
    input.data({ 'valid': false });
    input.addClass('zone-card__invalid-input');
    initPopover('Некорректные данные', input);
};

//если правильный формат данных делать поле валидным
makeValidInput = input => {
    input.data({ 'valid': true });
    input.removeClass('zone-card__invalid-input');
    errPopover.popover('hide');
};

//сохранение настроенных данных
saveResultData = () => {
    const zoneList = $('.zone-card');
    let resultData = [], extraCharges, error = false;

    zoneList.each((index, zone) => {
        resultData.push({});
        resultData[index].rate_area_id = tariffZones[$(zone).data('index')].id;
        if ($(zone).find('.base-cost__input').val() == '') {
            initPopover('Укажите базовую стоимость', $(zone).find('.base-cost__input'));
            error = true;
        } else {
            resultData[index].base_charge_value = Number($(zone).find('.base-cost__input').val());
            resultData[index].extra_charges = [];
            extraCharges = $(zone).find('.extra-charge');
            extraCharges.each((i, charge) => {
                error = checkWeightDiapason(charge, resultData[index].extra_charges);
                resultData[index].extra_charges.push({});
                if ($(charge).find('.extra-charge__input-min').val() == '') {
                    initPopover('Укажите вес', $(charge).find('.extra-charge__input-min'));
                    error = true;
                } else {
                    resultData[index].extra_charges[i].min_weight = $(charge).find('.extra-charge__input-min').val();
                    if ($(charge).find('.extra-charge__input-max').val() == '') {
                        initPopover('Укажите вес', $(charge).find('.extra-charge__input-max'));
                        error = true;
                    } else {
                        resultData[index].extra_charges[i].max_weight = $(charge).find('.extra-charge__input-max').val();

                        if ($(charge).find('.extra-charge__cost-value').val() == '') {
                            initPopover('Укажите наценку', $(charge).find('.extra-charge__cost-value'));
                            error = true;
                        } else {
                            resultData[index].extra_charges[i].charge_value = $(charge).find('.extra-charge__cost-value').val();
                        }
                    }
                }
            });
        }
    });

    if (error) {
        return false
    } else {
        console.log(resultData);
        $('.dialog__message').text('Сохранено!');
        modalDialog.dialog("open");
    }
};

//проверяе перекрываются ли разные диапазоны веса друг с другом
checkWeightDiapason = (charge, arrCharges) => {
    let error = false;
    let chargeMinWeight = $(charge).find('.extra-charge__input-min').val();
    let chargeMaxWeight = $(charge).find('.extra-charge__input-max').val();
    for (let i = 0; i < arrCharges.length; i++) {
        if (chargeMinWeight >= arrCharges[i].min_weight && chargeMinWeight <= arrCharges[i].max_weight) {
            error = true;
        }
        if (chargeMaxWeight >= arrCharges[i].min_weight && chargeMaxWeight <= arrCharges[i].max_weight) {
            error = true;
        }
    }
    
    if (error) {
        initPopover('Диапазоны веса перекрываются',$(charge).closest('.extra-charge'))
    } else {
        errPopover.popover('hide');
    }
    return error;
};

//настройка сообщения с ошибкой
initPopover = (errMsg, element) => {
    errPopover = element.popover({
        title: 'Ошибка',
        content: errMsg,
        trigger: 'manual',
        placement: 'bottom'
    });

    errPopover.popover('show');
};