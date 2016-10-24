// Импорт компонентов для работы React и Bootstrap
import React, {Component, PropTypes} from "react";
import ReactDOM from "react-dom";
import {Button, Modal, FormGroup, FormControl, ControlLabel, Row, Collapse, Alert} from 'react-bootstrap';

// Класс для обработки данных и вывода информации на страницу
class Map extends Component {
    constructor(props) {
        super(props);
        // Устанавливаем начальные значения переменных
        this.state = {
            // При запуске приложения показываем диалог ввода данных расхода и стоимости топлива
            showModal: true,
            // Задаем первичные значения расхода и стоимости топлива исходя из передынных props
            fuelConsumption: this.props.fuelConsumptionInitialValue,
            fuelPrice: this.props.fuelPriceInitialValue,
            oldFuelConsumption: this.props.fuelConsumptionInitialValue,
            oldFuelPrice: this.props.fuelPriceInitialValue,

            // Проверка и запись в state параметров карты.
            // В случае слишком маленьких размеров, устанавливаем минимальные чтобы элементы не заходили друг на друга
            mapWidth: (this.props.mapWidth > 550) ? this.props.mapWidth : 550,
            mapHeight: (this.props.mapHeight > 350) ? this.props.mapHeight : 350,

            // Переменная для обозначения активности режима редактирования маршурта
            editMode: true,

            // Координаты точек на карте для обозначения адресов до того как маршрут построен
            startPoint: null,
            finishPoint: null,

            // Координаты маршрута
            startPointCoords: null,
            finishPointCoords: null,
        };

        // Привязываем функции обработки данных к контексту класса
        this.saveSettings = this.saveSettings.bind(this);
        this.closeSettings = this.closeSettings.bind(this);
        this.openSettings = this.openSettings.bind(this);
        this.handleSettingsChange = this.handleSettingsChange.bind(this);
        this.fuelConsumptionValidation = this.fuelConsumptionValidation.bind(this);
        this.fuelPriceValidation = this.fuelPriceValidation.bind(this);

        this.onClick = this.onClick.bind(this);
        this.buildRoute = this.buildRoute.bind(this);
        this.addRouteInfo = this.addRouteInfo.bind(this);
        this.createMap = this.createMap.bind(this);
        this.setStartPoint = this.setStartPoint.bind(this);
        this.setFinishPoint = this.setFinishPoint.bind(this);
        this.swapAddresses = this.swapAddresses.bind(this);
        this.drawMap();
    }

    /**
     * ==================================================
     * ===== Рендер и функционал окна с настройками =====
     * ==================================================
     */

    /**
     * Сохраняем данные только в случае если пройдена валидация данных (если кто-то смог обойти правило в методе handleSettingsChange)
     */
    saveSettings() {
        if (this.fuelConsumptionValidation() == 'success' && this.fuelPriceValidation() == 'success') {
            this.setState({showModal: false});

            let routeLength = null;

            if (this.multiRoute) {
                routeLength = this.multiRoute.getActiveRoute().properties.get('distance').value / 1000;
            }
            if (this.myMap) {
                this.addRouteInfo(routeLength);
                this.buttonSettings.deselect();
            }
        }
    }

    /**
     * Отмена изменений в меню настроек расхода и стоимости топлива
     */
    closeSettings() {
        this.setState({fuelConsumption: this.state.oldFuelConsumption});
        this.setState({fuelPrice: this.state.oldFuelPrice});
        this.setState({showModal: false});
        this.buttonSettings.deselect();
    }

    /**
     * При открытии меню настроек запоминвем старые значения для возможности отката в случае нажатия кнопки отмены
     */
    openSettings() {
        this.setState({oldFuelConsumption: this.state.fuelConsumption});
        this.setState({oldFuelPrice: this.state.fuelPrice});
        this.setState({showModal: true});
    }

    /**
     * Валидация. Потребление топлива должно быть числом
     */
    fuelConsumptionValidation() {
        if (isNaN(this.state.fuelConsumption)) {
            return 'error';
        }
        return 'success';
    }

    /**
     * Валидация. Цена должна быть числом
     */
    fuelPriceValidation() {
        if (isNaN(this.state.fuelPrice)) {
            return 'error';
        }
        return 'success';
    }

    /**
     * При вводе данных разрешаем использовать только числа и изменяем state переменной
     */
    handleSettingsChange(e) {
        if (!isNaN(e.target.value)) {
            this.setState({[e.target.id]: e.target.value});
        }
    }

    /**
     * Рендер кнопки вызова настроек и формы ля заполнения
     */
    renderSettings() {
        return (
            <div className="modal-container">
                <Modal show={this.state.showModal} onHide={this.closeSettings}>
                    <Modal.Header closeButton>
                        <Modal.Title>Настройки расхода и стоимости топлива</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <form>
                            <FormGroup
                                controlId="fuelConsumption"
                                validationState={this.fuelConsumptionValidation(this)}
                            >
                                <ControlLabel>Введите потребление топлива на 100 км.</ControlLabel>
                                <FormControl
                                    type="text"
                                    value={this.state.fuelConsumption}
                                    placeholder="Значение должно быть положительным числом"
                                    onChange={this.handleSettingsChange}
                                />
                                <FormControl.Feedback />
                            </FormGroup>

                            <FormGroup
                                controlId="fuelPrice"
                                validationState={this.fuelPriceValidation(this)}
                            >
                                <ControlLabel>Введите стоимость топлива.</ControlLabel>
                                <FormControl
                                    type="text"
                                    value={this.state.fuelPrice}
                                    placeholder="Значение должно быть положительным числом"
                                    onChange={this.handleSettingsChange}
                                />
                                <FormControl.Feedback />
                            </FormGroup>
                        </form>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button onClick={this.saveSettings} bsStyle="success">Сохранить</Button>
                        <Button onClick={this.closeSettings} bsStyle="danger">Отменить</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }

    /**
     * ===========================================
     * ===== Рендер и работа с картой Yandex =====
     * ===========================================
     */

    /**
     * Функция определения местоположения пользователя и создания карты
     */
    createMap() {
        this.myMap = null;
        // Получение координат местоположения пользователя
        ymaps.geolocation.get().then(function (res) {
            let mapCenterAndZoom = ymaps.util.bounds.getCenterAndZoom(
                res.geoObjects.get(0).properties.get('boundedBy'),
                [this.state.mapWidth, this.state.mapHeight]
            );

            this.myMap = new ymaps.Map('map', {
                center: mapCenterAndZoom.center,
                zoom: mapCenterAndZoom.zoom,
                type: 'yandex#map',
                controls: []
            }, {
                buttonMaxWidth: 300
            });

            this.addControlsToMap();
            this.addRouteInfo();
        }.bind(this), function () {
            // Если место положение невозможно получить, то просто создаем карту.
            this.myMap = new ymaps.Map('map', {
                center: [55.750475, 37.616273],
                zoom: 9,
                type: 'yandex#map',
                controls: []
            }, {
                buttonMaxWidth: 300
            });

            console.log('asdf');

            this.addControlsToMap();
            this.addRouteInfo();
        });
    }

    /**
     * Добавление элементов управления на карту
     */
    addControlsToMap() {
        // Поисковое поле для начала маршрута
        this.searchStartPoint = new ymaps.control.SearchControl({
            options: {
                useMapBounds: true,
                noPlacemark: true,
                noPopup: true,
                placeholderContent: 'Адрес начальной точки',
                size: 'large',
                visible: this.state.editMode
            }
        });

        // Поисковое поле для конечной точки маршрута
        this.searchFinishPoint = new ymaps.control.SearchControl({
            options: {
                useMapBounds: true,
                noCentering: true,
                noPopup: true,
                noPlacemark: true,
                placeholderContent: 'Адрес конечной точки',
                size: 'large',
                float: 'none',
                position: {left: 10, top: 44},
                visible: this.state.editMode
            }
        });

        /**
         * Добавляем обработу событий для поисковых полей
         *
         * Событие "resultselect":
         * При выборе какого-либо варианта из поиска получаем координаты точки
         * и записываем их в переменную startPointCoords или searchFinishPoint.
         * Если маршрут еще не построен, ставим отметку на карте для наглядности при составлении маршрута
         *
         * Событие "load":
         * По полю skip определяем, что это не дозагрузка данных.
         * По getResultsCount определяем, что есть хотя бы 1 результат.
         */

        this.searchStartPoint.events
            .add('resultselect', function (e) {
                let results = this.searchStartPoint.getResultsArray();
                let selected = e.get('index');
                let point = results[selected].geometry.getCoordinates();
                this.setState({startPointCoords: point});
                if (!this.buildRoute()) {
                    this.setStartPoint(point);
                }
            }.bind(this))
            .add('load', function (event) {
                if (!event.get('skip') && this.searchStartPoint.getResultsCount()) {
                    this.searchStartPoint.showResult(0);
                }
            }.bind(this));

        this.searchFinishPoint.events
            .add('resultselect', function (e) {
                let results = this.searchFinishPoint.getResultsArray();
                let selected = e.get('index');
                let point = results[selected].geometry.getCoordinates();
                this.setState({finishPointCoords: point});
                if (!this.buildRoute()) {
                    this.setFinishPoint(point);
                }
            }.bind(this))
            .add('load', function (event) {
                if (!event.get('skip') && this.searchFinishPoint.getResultsCount()) {
                    this.searchFinishPoint.showResult(0);
                }
            }.bind(this));

        // Кнопка включения и отключения режима редактирования
        this.buttonEditor = new ymaps.control.Button({
            data: {content: "Режим редактирования"},
            options: {
                float: "right",
                floatIndex: 0
            }
        });

        // Кнопка смены мест адресов
        this.buttonSwap = new ymaps.control.Button({
            data: {content: "Сменить адреса"}
        });

        // Кнопка смены мест адресов
        this.buttonSettings = new ymaps.control.Button({
            data: {image: "img/cog.png"},
            options: {
                float: "right",
                floatIndex: 1
            }
        });

        // При входе в режим редактирования, делаем видимыми поля поиска и кнопку смена адресов
        // И присваиваем переменной editMode значение true, что в свою очередь отображает предупреждение о входе в режим
        this.buttonEditor.events.add("select", function () {
            this.buttonSwap.options.set('visible', true);
            this.searchStartPoint.options.set('visible', true);
            this.searchFinishPoint.options.set('visible', true);
            let routeLength = null;
            this.setState({editMode: true});
            if (this.multiRoute) {
                routeLength = this.multiRoute.getActiveRoute().properties.get('distance').value / 1000;
                this.multiRoute.editor.start({
                    addWayPoints: false,
                    dragWayPoints: true,
                    addMidPoints: false,
                });
            }
            this.addRouteInfo(routeLength);
        }.bind(this));

        // При выходе из режима редактирования прячем элементы редактирования маршрута и скрываем предупреждение
        this.buttonEditor.events.add("deselect", function () {
            this.buttonSwap.options.set('visible', false);
            this.searchStartPoint.options.set('visible', false);
            this.searchFinishPoint.options.set('visible', false);
            let routeLength = null;
            this.setState({editMode: false});
            // Выключение режима редактирования.
            if (this.multiRoute) {
                routeLength = this.multiRoute.getActiveRoute().properties.get('distance').value / 1000;
                this.multiRoute.editor.stop();
            }
            this.addRouteInfo(routeLength);
        }.bind(this));

        // Событие нажатия кнопки смены адресов
        this.buttonSwap.events.add("click", () => {
            this.swapAddresses()
        });

        // Событие нажатия кнопки вызова настройек расхода и сотимости топлива
        this.buttonSettings.events.add("click", () => {
            this.openSettings()
        });

        // Создаем элемент для отображения данных по проложенному маршруту:
        // расход на 100 км., стоимость за 1 л., расстояние, расход на маршурт, стоиомсть за весь маршрут

        // И наследуем RouteInfo от collection.Item для добавления его как элемент управления
        ymaps.util.augment(RouteInfo, ymaps.collection.Item, {
            onAddToMap: function (map) {
                RouteInfo.superclass.onAddToMap.call(this, map);
                this.getParent().getChildElement(this).then(this.onGetChildElement, this);
            },

            onRemoveFromMap: function (oldMap) {
                if (this.content) {
                    this.content.remove();
                }
                RouteInfo.superclass.onRemoveFromMap.call(this, oldMap);
            },

            onGetChildElement: function (parentDomContainer) {
                let fuelConsumptionPerHundred = this.options.get('fuelConsumption');
                let fuelPricePerLitre = this.options.get('fuelPrice');
                let routeLength = this.options.get('routeLength');
                let fuelTotalConsumption = (routeLength / 100) * fuelConsumptionPerHundred;
                let fuelTotalPrice = fuelTotalConsumption * fuelPricePerLitre;

                let settingsText =
                    "Расход на 100 км.: " + fuelConsumptionPerHundred + "<br>" +
                    "Стоимость 1л.: " + fuelPricePerLitre;

                let routeText = '';

                if (routeLength != null) {
                    routeText =
                        "<hr>Длина пути: " + routeLength.toFixed(3) + "<br>" +
                        "Расход топлива: " + fuelTotalConsumption.toFixed(2) + "<br>" +
                        "Стоимость поездки: " + fuelTotalPrice.toFixed(2);
                }

                // Создаем HTML-элемент с текстом.
                this.content = document.createElement('div');
                this.content.className = "well";
                this.content.innerHTML = settingsText.concat(routeText);

                parentDomContainer.appendChild(this.content);
            },
        });

        this.routeInfo = new RouteInfo();

        // Добавляем на карту элементы управления
        this.myMap.controls.add(this.searchStartPoint);
        this.myMap.controls.add(this.searchFinishPoint);
        this.myMap.controls.add(this.buttonSettings);
        this.myMap.controls.add(this.buttonEditor);
        this.myMap.controls.add(this.buttonSwap);
        this.myMap.events.add('click', this.onClick);

        this.buttonEditor.select();

        this.addRouteInfo();
    }

    /**
     * Добавление информации о маршруте
     */
    addRouteInfo(routeLength = null) {
        this.myMap.controls.remove(this.routeInfo);

        this.myMap.controls.add(this.routeInfo, {
            fuelConsumption: this.state.fuelConsumption,
            fuelPrice: this.state.fuelPrice,
            routeLength: routeLength,
            float: 'none',
            position: {
                top: this.state.editMode ? 90 : 10,
                left: 10
            }
        });
    }

    /**
     * Построение маршрута
     */
    buildRoute() {
        // Если маршрут уже есть, удаляем его
        if (this.state.startPointCoords && this.state.finishPointCoords) {
            if (this.multiRoute) {
                this.myMap.geoObjects.remove(this.multiRoute);
            }

            // Удаляем отметки от searchStartPoint и searchFinishPoint,
            // т.к. при составлении маршрута нужные точки появтся сами от multiRouter
            this.myMap.geoObjects.remove(this.state.startPoint);
            this.myMap.geoObjects.remove(this.state.finishPoint);

            // Строим маршрут на основании полученных ранее координат
            // Запрещаем использовать транзитные точки
            // В режиме добавления новых путевых точек запрещаем ставить точки поверх объектов карты.
            this.multiRoute = new ymaps.multiRouter.MultiRoute({
                referencePoints: [this.state.startPointCoords, this.state.finishPointCoords]
            }, {
                addMidPoints: false,
                editorDrawOver: false,
                boundsAutoApply: true
            });

            // После создания маршрута сразу включаем режим его редактирования
            // Разрешено только перетаскивание существующих точек
            this.multiRoute.editor.start({
                addWayPoints: false,
                dragWayPoints: true,
                addMidPoints: false,
            });

            // Обработка события окончания перетаскивания путевых точек
            this.multiRoute.editor.events.add('waypointdragend', function () {
                // Получаем новые координаты точек
                // и записываем их в координаты для построения маршрута
                let startPoint = this.multiRoute.properties.get('waypoints.0.coordinates').reverse();
                let finishPoint = this.multiRoute.properties.get('waypoints.1.coordinates').reverse();
                let routeLength = this.multiRoute.getActiveRoute().properties.get('distance').value / 1000;

                this.setState({startPointCoords: startPoint});
                this.setState({finishPointCoords: finishPoint});

                // Записываем в поля поиска новые адреса точен
                // Приходится использовать опцию 'noSuggestPanel' чтобы избежать постоянного появления всплывающих окон
                // с результатами поиска по введенному адресу
                ymaps.geocode(startPoint, {results: 1}).then(function (res) {
                    this.searchStartPoint.options.set('noSuggestPanel', true);
                    this.searchStartPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchStartPoint.options.set('noSuggestPanel', false);
                }.bind(this));
                ymaps.geocode(finishPoint, {results: 1}).then(function (res) {
                    this.searchFinishPoint.options.set('noSuggestPanel', true);
                    this.searchFinishPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchFinishPoint.options.set('noSuggestPanel', false);
                }.bind(this));

                this.addRouteInfo(routeLength);
            }.bind(this));

            this.multiRoute.events.add('activeroutechange', function () {
                let routeLength = this.multiRoute.getActiveRoute().properties.get('distance').value / 1000;
                this.addRouteInfo(routeLength);
            }.bind(this));

            // Добавляем на карту новый маршрут
            this.myMap.geoObjects.add(this.multiRoute);
            return true;
        }
        return false;
    }

    /**
     * Обработчик клика по карте. Получаем координаты точки на карте и создаем маркер.
     */
    onClick(event) {
        // Клик по карте обрабатываем только в случае активного режима редактирования
        // и пока не созданы обе точки для маршрута
        // как в самом Yandex - при созданном маршруте дополнительные путевые точки не создаются
        if (this.state.editMode && !(this.state.startPointCoords && this.state.finishPointCoords)) {
            // Если точка старта уже присутствует, то создаем конечную точку
            if (this.state.startPoint) {
                let coords = event.get('coords');
                this.setState({finishPointCoords: coords});

                // Записываем адрес в поисковую строку
                ymaps.geocode(coords, {results: 1}).then(function (res) {
                    this.searchFinishPoint.options.set('noSuggestPanel', true);
                    this.searchFinishPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchFinishPoint.options.set('noSuggestPanel', false);
                }.bind(this));

                // Создаем маршрут
                this.buildRoute();

                // Если маршрут еще не создан, ставим маркер на карту для обозначения местонахождения адреса
                if (!this.multiRoute) {
                    this.setFinishPoint(event.get('coords'));
                }
            } else {
                let coords = event.get('coords');
                this.setState({startPointCoords: coords});

                // Записываем адрес в поисковую строку
                ymaps.geocode(coords, {results: 1}).then(function (res) {
                    this.searchStartPoint.options.set('noSuggestPanel', true);
                    this.searchStartPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchStartPoint.options.set('noSuggestPanel', false);
                }.bind(this));

                // Создаем маршрут
                this.buildRoute();

                // Если маршрут еще не создан, ставим маркер на карту для обозначения местонахождения адреса
                if (!this.multiRoute) {
                    this.setStartPoint(event.get('coords'));
                }
            }
        }
    }

    /**
     * Создаем начальную точку маршрута.
     * Если точка создана, то обновляем координаты.
     */
    setStartPoint(position) {
        if (this.state.startPoint) {
            this.state.startPoint.geometry.setCoordinates(position);
        } else {
            // Создаем маркер с возможностью перетаскивания (опция `draggable`).
            // По завершении перетаскивания обновляем координаты для маршрута и записываем новый адрес в поле поиска
            this.setState({startPoint: new ymaps.Placemark(position, {iconContent: 'А'}, {draggable: true})});
            this.state.startPoint.events.add('dragend', function (event) {
                let coords = event.originalEvent.target.geometry.getCoordinates();
                this.setState({startPointCoords: coords});
                ymaps.geocode(coords, {results: 1}).then(function (res) {
                    this.searchStartPoint.options.set('noSuggestPanel', true);
                    this.searchStartPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchStartPoint.options.set('noSuggestPanel', false);
                }.bind(this));
            }.bind(this));
            // Функция обработки наведения мыши на маркер
            // С помощью нее определяем включен режим редактирования или нет
            // и исходя из этого разрешаем или запрещаем перетаскивание маркера
            this.state.startPoint.events.add('mouseenter', function () {
                this.state.startPoint.options.set('draggable', this.state.editMode);
            }.bind(this));
            this.myMap.geoObjects.add(this.state.startPoint);
        }
    }

    /**
     * Создаем конечную точку маршрута.
     * Если точка создана, то обновляем координаты.
     */
    setFinishPoint(position) {
        if (this.state.finishPoint) {
            this.state.finishPoint.geometry.setCoordinates(position);
        } else {
            // Создаем маркер с возможностью перетаскивания (опция `draggable`).
            // По завершении перетаскивания обновляем координаты для маршрута и записываем новый адрес в поле поиска
            this.setState({finishPoint: new ymaps.Placemark(position, {iconContent: 'Б'}, {draggable: true})});
            this.state.finishPoint.events.add('dragend', function (event) {
                let coords = event.originalEvent.target.geometry.getCoordinates();
                this.setState({finishPointCoords: coords});
                ymaps.geocode(coords, {results: 1}).then(function (res) {
                    this.searchFinishPoint.options.set('noSuggestPanel', true);
                    this.searchFinishPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchFinishPoint.options.set('noSuggestPanel', false);
                }.bind(this));
            }.bind(this));
            // Функция обработки наведения мыши на маркер
            // С помощью нее определяем включен режим редактирования или нет
            // и исходя из этого разрешаем или запрещаем перетаскивание маркера
            this.state.finishPoint.events.add('mouseenter', function () {
                this.state.finishPoint.options.set('draggable', this.state.editMode);
            }.bind(this));
            this.myMap.geoObjects.add(this.state.finishPoint);
        }
    }

    /**
     * Функция смена адресов
     * Меняем местами координаты маршрута и адреса точек
     */
    swapAddresses() {
        if (this.state.startPointCoords && this.state.finishPointCoords) {
            let tempAddress = this.state.startPointCoords;
            this.setState({startPointCoords: this.state.finishPointCoords});
            this.setState({finishPointCoords: tempAddress});

            ymaps.geocode(this.state.startPointCoords, {results: 1}).then(function (res) {
                this.searchStartPoint.options.set('noSuggestPanel', true);
                this.searchStartPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                this.searchStartPoint.options.set('noSuggestPanel', false);
            }.bind(this));
            ymaps.geocode(this.state.finishPointCoords, {results: 1}).then(function (res) {
                this.searchFinishPoint.options.set('noSuggestPanel', true);
                this.searchFinishPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                this.searchFinishPoint.options.set('noSuggestPanel', false);
            }.bind(this));

            this.buildRoute();
        }

        this.buttonSwap.select();
    }

    /**
     * Функия определения готовности API Yandex и вызов функции создания карты
     */
    drawMap() {
        ymaps.ready(this.createMap);
    }

    /**
     * Отрисовка карты и оповещения о входе в режим редактирования
     */
    renderMap() {
        return (
            <div style={{width: this.state.mapWidth + "px"}}>
                <Collapse in={this.state.editMode}>
                    <Alert className="text-center" bsStyle="warning">
                        <strong>Включен режим редактирования</strong>
                    </Alert>
                </Collapse>
                <div id="map" style={{height: this.state.mapHeight + "px"}}></div>
            </div>
        )
    }

    /**
     * Отрисовка всего модуля
     */
    render() {
        return (
            <div className="main" style={{marginTop: "10px"}}>
                {/* Ряд для кнопки настроек топлива в котором создается модальное окно с настройками топлива */}
                <Row>
                    { this.renderSettings() }
                </Row>
                {/* Ряд для отрисовки карты */}
                <Row>
                    { this.renderMap() }
                </Row>
            </div>
        );
    }
}

// Класс информации о маршруте
class RouteInfo {
    constructor(options) {
        RouteInfo.superclass.constructor.call(this, options);
        this.content = null;
    }
}

/**
 * Указываем что значения расхода и стоимости топлива должжны быть числами и что они обязательны для ввода
 * При неправильном типе данных переменных или их отсутствии в консоль браузера будут
 */
Map.propTypes = {
    fuelConsumptionInitialValue: React.PropTypes.number.isRequired,
    fuelPriceInitialValue: React.PropTypes.number.isRequired,
    mapHeight: React.PropTypes.number.isRequired,
    mapWidth: React.PropTypes.number.isRequired,
};

/**
 * Задаем значения по умолчанию
 */
Map.defaultProps = {
    fuelConsumptionInitialValue: 10,
    fuelPriceInitialValue: 39,
    mapHeight: 550,
    mapWidth: 1280,
};


// Класс для примера
class Example extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <h1 className="text-center">Расчет маршрута | React + Yandex Map API</h1>
                <hr/>
                <Map fuelConsumptionInitialValue={9} fuelPriceInitialValue={38.5} mapHeight={550} mapWidth={1280}/>
                <hr/>
                <div>
                    <h4>Задача:</h4>
                    <p>Создать веб-приложение, используя api Яндекс карт последней версии. Использовать любой фреймворк
                        (angular, ember, react, backbone, ... ).</p>
                    <ul>
                        <li>Показывается поп-ап с настройками 1 раз при первом запуске приложения, затем настройки можно
                            вызывать по кнопке открыть настройки. В полях расход на 100 км и цена за литр указать
                            демо-данные, которые в дальнейшем можно будет редактировать.
                        </li>
                        <li>Вводим названия точек А и Б (пунктов), прокладывается путь на карте. Пункты можно менять
                            местами, так же редактировать, нажав кнопку режим редактирования, при этом показываем
                            пользователю, что режим редактирования активен. В режиме редактирования можно перетаскивать
                            сам путь на карте.
                        </li>
                        <li>Информация путь и кол-во топлива выводится ниже текстовых полей маршрут</li>
                    </ul>
                    <p>Приложение должно уметь правильно рассчитывать путь и количество затрачиваемого топлива для
                        данного пути.</p>
                </div>
            </div>
        );
    }
}

/**
 * Выводим созданный класс на страницу пользователю
 */

ReactDOM.render(
    <Example />,
    document.getElementById('content')
);