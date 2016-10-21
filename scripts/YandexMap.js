// Импорт компонентов для работы React и Bootstrap
import React, {Component, PropTypes} from "react";
import ReactDOM from "react-dom";
import {
    Button,
    Modal,
    Form,
    FormGroup,
    FormControl,
    ControlLabel,
    Glyphicon,
    Row,
    Col,
    Collapse,
    Alert
} from 'react-bootstrap';

// Класс для обработки данных и вывода информации на страницу
class CalculateYandexMapRoute extends Component {
    constructor(props) {
        super(props);
        // Устанавливаем начальные значения переменных
        this.state = {
            // При запуске приложения показываем диалог ввода данных расхода и стоимости топлива
            showModal: false,
            // Задаем первичные значения расхода и стоимости топлива исходя из передынных props
            fuelConsumption: this.props.fuelConsumptionInitialValue,
            fuelPrice: this.props.fuelPriceInitialValue,
            oldFuelConsumption: this.props.fuelConsumptionInitialValue,
            oldFuelPrice: this.props.fuelPriceInitialValue,
        };

        // Привязываем функции обработки данных к контексту класса
        this.saveSettings = this.saveSettings.bind(this);
        this.closeSettings = this.closeSettings.bind(this);
        this.openSettings = this.openSettings.bind(this);
        this.handleSettingsChange = this.handleSettingsChange.bind(this);
    }

    // Сохраняем данные только в случае если пройдена валидация данных (если кто-то смог обойти правило в методе handleSettingsChange)
    saveSettings() {
        if (this.fuelConsumptionValidation() == 'success' && this.fuelPriceValidation() == 'success') {
            this.setState({showModal: false});
        }
    }

    // Отмена изменений в меню настроек расхода и стоимости топлива
    closeSettings() {
        this.setState({fuelConsumption: this.state.oldFuelConsumption});
        this.setState({fuelPrice: this.state.oldFuelPrice});
        this.setState({showModal: false});
    }

    // При открытии меню настроек запоминвем старые значения для возможности отката в случае нажатия кнопки отмены
    openSettings() {
        this.setState({oldFuelConsumption: this.state.fuelConsumption});
        this.setState({oldFuelPrice: this.state.fuelPrice});
        this.setState({showModal: true});
    }

    // Валидация. Потребление топлива должно быть числом
    fuelConsumptionValidation() {
        if (isNaN(this.state.fuelConsumption)) {
            return 'error';
        }
        return 'success';
    }

    // Валидация. Цена должна быть числом
    fuelPriceValidation() {
        if (isNaN(this.state.fuelPrice)) {
            return 'error';
        }
        return 'success';
    }

    // При вводе данных разрешаем использовать только числа и изменяем state переменной
    handleSettingsChange(e) {
        if (!isNaN(e.target.value)) {
            this.setState({[e.target.id]: e.target.value});
        }
    }

    render() {
        return (
            <div className="main">
                {/* Ряд для кнопки настроек топлива в котором создается модальное окно с настройками топлива */}
                <Row>
                    <div className="modal-container">
                        <div id="menu" className="pull-right">
                            <Button bsStyle="primary" onClick={this.openSettings}><Glyphicon glyph="cog"/></Button>
                        </div>


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
                                            placeholder="Значение должно быть числом"
                                            onChange={this.handleSettingsChange}
                                        />
                                        <FormControl.Feedback />
                                    </FormGroup>

                                    <FormGroup
                                        controlId="fuelPrice"
                                        validationState={this.fuelPriceValidation(this)}
                                    >
                                        <ControlLabel>Введите тоимость топлива.</ControlLabel>
                                        <FormControl
                                            type="text"
                                            value={this.state.fuelPrice}
                                            placeholder="Значение должно быть числом"
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
                        <div className="col-lg-12">
                            <hr />
                        </div>
                    </div>
                </Row>

                <Row>
                    <Map />
                </Row>
            </div>
        );
    }
}

// Указываем что значения расхода и стоимости топлива должжны быть числами и что они обязательны для ввода
// При неправильном типе данных переменных или их отсутствии в консоль браузера будут выведены ошибки
CalculateYandexMapRoute.propTypes = {
    fuelConsumptionInitialValue: React.PropTypes.number.isRequired,
    fuelPriceInitialValue: React.PropTypes.number.isRequired
};

// Задаем значения по умолчанию
CalculateYandexMapRoute.defaultProps = {
    fuelConsumptionInitialValue: 13,
    fuelPriceInitialValue: 37.35
};


class Map extends Component {
    constructor(props) {
        super(props);
        // Устанавливаем начальные значения переменных
        this.state = {
            editMode: false,
            startPointAddress: '',
            finishPointAddress: '',
            startPointCoords: null,
            finishPointCoords: null,
        };

        this.onClick = this.onClick.bind(this);
        this.createMap = this.createMap.bind(this);
        this.setStartPoint = this.setStartPoint.bind(this);
        this.setFinishPoint = this.setFinishPoint.bind(this);
        this.renderMap();
    }

    createMap() {
        this.myMap = new ymaps.Map('map', {
            center: [55.750475, 37.616273],
            zoom: 9,
            type: 'yandex#map',
            controls: []
        }, {
            buttonMaxWidth: 300
        });

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

        this.buttonEditor = new ymaps.control.Button({
            data: {content: "Режим редактирования"}
        });

        this.buttonSwap = new ymaps.control.Button({
            data: {content: "Сменить адреса"}
        });

        this.buttonEditor.events.add("select", function () {
            this.buttonSwap.options.set('visible', true);
            this.searchStartPoint.options.set('visible', true);
            this.searchFinishPoint.options.set('visible', true);
            this.setState({editMode: this.state.editMode = true});
            if (this.multiRoute) {
                this.multiRoute.editor.start({
                    addWayPoints: false,
                    dragWayPoints: true,
                    addMidPoints: false,
                });
            }
        }.bind(this));

        this.buttonEditor.events.add("deselect", function () {
            this.buttonSwap.options.set('visible', false);
            this.searchStartPoint.options.set('visible', false);
            this.searchFinishPoint.options.set('visible', false);
            this.setState({editMode: false});
            // Выключение режима редактирования.
            if (this.multiRoute) {
                this.multiRoute.editor.stop();
            }
        }.bind(this));

        this.buttonSwap.events.add("click", () => { this.swapAddresses() });

        this.myMap.controls.add(this.searchStartPoint);
        this.myMap.controls.add(this.searchFinishPoint);
        this.myMap.controls.add(this.buttonEditor);
        this.myMap.controls.add(this.buttonSwap);
        this.myMap.events.add('click', this.onClick);

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
                // По полю skip определяем, что это не дозагрузка данных.
                // По getResultsCount определяем, что есть хотя бы 1 результат.
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
                // По полю skip определяем, что это не дозагрузка данных.
                // По getResultsCount определяем, что есть хотя бы 1 результат.
                if (!event.get('skip') && this.searchFinishPoint.getResultsCount()) {
                    this.searchFinishPoint.showResult(0);
                }
            }.bind(this));

        this.buttonEditor.select();
    }

    buildRoute() {
        if (this.state.startPointCoords && this.state.finishPointCoords) {
            if (this.multiRoute) {
                this.myMap.geoObjects.remove(this.multiRoute);
            }

            this.myMap.geoObjects.remove(this._startPoint);
            this.myMap.geoObjects.remove(this._finishPoint);

            this.multiRoute = new ymaps.multiRouter.MultiRoute({
                referencePoints: [this.state.startPointCoords, this.state.finishPointCoords]
            }, {
                // Тип промежуточных точек, которые могут быть добавлены при редактировании.
                addMidPoints: false,
                // В режиме добавления новых путевых точек запрещаем ставить точки поверх объектов карты.
                editorDrawOver: false
            });

            this.multiRoute.editor.start({
                addWayPoints: false,
                dragWayPoints: true,
                addMidPoints: false,
            });

            this.multiRoute.editor.events.add('waypointdragend', function () {
                let startPoint = this.multiRoute.properties.get('waypoints.0.coordinates').reverse();
                let finishPoint = this.multiRoute.properties.get('waypoints.1.coordinates').reverse();

                this.setState({startPointCoords: startPoint});
                this.setState({finishPointCoords: finishPoint});

                ymaps.geocode(startPoint).then(function (res) {
                    this.searchStartPoint.options.set('noSuggestPanel', true);
                    this.searchStartPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchStartPoint.options.set('noSuggestPanel', false);
                }.bind(this));
                ymaps.geocode(finishPoint).then(function (res) {
                    this.searchFinishPoint.options.set('noSuggestPanel', true);
                    this.searchFinishPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchFinishPoint.options.set('noSuggestPanel', false);
                }.bind(this));
            }.bind(this));

            this.myMap.geoObjects.add(this.multiRoute);
            return true;
        }

        return false;
    }

    /**
     * Обработчик клика по карте. Получаем координаты точки на карте и создаем маркер.
     * @param  {Object} event Событие.
     */
    onClick(event) {
        if (this.state.editMode && !(this.state.startPointCoords && this.state.finishPointCoords)) {
            if (this._startPoint) {
                let coords = event.get('coords');
                this.setState({finishPointCoords: coords});

                ymaps.geocode(coords).then(function (res) {
                    this.searchFinishPoint.options.set('noSuggestPanel', true);
                    this.searchFinishPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchFinishPoint.options.set('noSuggestPanel', false);
                }.bind(this));

                this.buildRoute();

                if (!this.multiRoute) {
                    this.setFinishPoint(event.get('coords'));
                }
            } else {
                let coords = event.get('coords');
                this.setState({startPointCoords: coords});

                ymaps.geocode(coords).then(function (res) {
                    this.searchStartPoint.options.set('noSuggestPanel', true);
                    this.searchStartPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchStartPoint.options.set('noSuggestPanel', false);
                }.bind(this));

                this.buildRoute();

                if (!this.multiRoute) {
                    this.setStartPoint(event.get('coords'));
                }
            }
        }
    }

    /**
     * Создаем начальную точку маршрута.
     * Если точка создана, то обновляем координаты.
     * @param {Number[]} position Координаты точки.
     */
    setStartPoint(position) {
        if (this._startPoint) {
            this._startPoint.geometry.setCoordinates(position);
        } else {
            // Создаем маркер с возможностью перетаскивания (опция `draggable`).
            // По завершении перетаскивания вызываем обработчик `_onStartDragEnd`.
            this._startPoint = new ymaps.Placemark(position, {iconContent: 'А'}, {draggable: true});
            this._startPoint.events.add('dragend', function (event) {
                let coords = event.originalEvent.target.geometry.getCoordinates();
                this.setState({startPointCoords: coords});
                ymaps.geocode(coords).then(function (res) {
                    this.searchStartPoint.options.set('noSuggestPanel', true);
                    this.searchStartPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchStartPoint.options.set('noSuggestPanel', false);
                }.bind(this));
            }.bind(this));
            this._startPoint.events.add('mouseenter', function () {
                this._startPoint.options.set('draggable', this.state.editMode);
            }.bind(this));
            this.myMap.geoObjects.add(this._startPoint);
        }
    };

    /**
     * Создаем конечную точку маршрута.
     * Если точка создана, то обновляем координаты.
     * @param {Number[]} position Координаты точки.
     */
    setFinishPoint(position) {
        if (this._finishPoint) {
            this._finishPoint.geometry.setCoordinates(position);
        } else {
            this._finishPoint = new ymaps.Placemark(position, {iconContent: 'Б'}, {draggable: true});
            this._finishPoint.events.add('dragend', function (event) {
                let coords = event.originalEvent.target.geometry.getCoordinates();
                this.setState({finishPointCoords: coords});
                ymaps.geocode(coords).then(function (res) {
                    this.searchFinishPoint.options.set('noSuggestPanel', true);
                    this.searchFinishPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                    this.searchFinishPoint.options.set('noSuggestPanel', false);
                }.bind(this));
            }.bind(this));
            this._finishPoint.events.add('mouseenter', function () {
                this._finishPoint.options.set('draggable', this.state.editMode);
            }.bind(this));
            this.myMap.geoObjects.add(this._finishPoint);
        }
    };

    swapAddresses() {
        if(this.state.startPointCoords && this.state.finishPointCoords) {
            let tempAddress = this.state.startPointCoords;
            this.setState({startPointCoords: this.state.finishPointCoords});
            this.setState({finishPointCoords: tempAddress});

            ymaps.geocode(this.state.startPointCoords).then(function (res) {
                this.searchStartPoint.options.set('noSuggestPanel', true);
                this.searchStartPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                this.searchStartPoint.options.set('noSuggestPanel', false);
            }.bind(this));
            ymaps.geocode(this.state.finishPointCoords).then(function (res) {
                this.searchFinishPoint.options.set('noSuggestPanel', true);
                this.searchFinishPoint.state.set('inputValue', res.geoObjects.get(0).properties.get('text'));
                this.searchFinishPoint.options.set('noSuggestPanel', false);
            }.bind(this));

            this.buildRoute();
        }

        this.buttonSwap.select();
    }

    renderMap() {
        ymaps.ready(this.createMap);
    }

    render() {
        return (
            <div>
                <Collapse in={this.state.editMode}>
                    <Alert className="text-center" bsStyle="warning">
                        <strong>Включен режим редактирования</strong>
                    </Alert>
                </Collapse>
                <div id="map" className="col-lg-12"></div>
            </div>
        )
    };
}


// Выводим созданный класс на страницу пользователю
ReactDOM.render(<CalculateYandexMapRoute />, document.getElementById('content'));