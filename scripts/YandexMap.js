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
            showModal: true,
            // Задаем первичные значения расхода и стоимости топлива исходя из передынных props
            fuelConsumption: this.props.fuelConsumptionInitialValue,
            fuelPrice: this.props.fuelPriceInitialValue,
            oldFuelConsumption: this.props.fuelConsumptionInitialValue,
            oldFuelPrice: this.props.fuelPriceInitialValue,

            editMode: true,
            departure: '',
            destination: '',
        };

        // Привязываем функции обработки данных к контексту класса
        this.saveSettings = this.saveSettings.bind(this);
        this.closeSettings = this.closeSettings.bind(this);
        this.openSettings = this.openSettings.bind(this);
        this.handleSettingsChange = this.handleSettingsChange.bind(this);
        this.handleAddressChange = this.handleAddressChange.bind(this);
        this.swapAddresses = this.swapAddresses.bind(this);
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

    // Изменяем state переменной
    handleAddressChange(e) {
        this.setState({[e.target.id]: e.target.value});
    }

    // Изменение адресов местами.
    /*
     * С помощью дополнительной переменной меняем адреса местами
     * Ищем поля ввода по id и записываем в них новые значения
     */
    swapAddresses() {
        let tempVar = this.state.departure;
        this.state.departure = this.state.destination;
        this.state.destination = tempVar;

        document.getElementById('departure').value = this.state.departure;
        document.getElementById('destination').value = this.state.destination;
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

                {/* Ряд для ввода адресов и кнопок для работы с ними */}
                <Row>
                    <Form horizontal>
                        {/* Оповещение пользователя о входе в режим редактирования. */}
                        <Collapse in={this.state.editMode}>
                            <Alert className="text-center" bsStyle="warning">
                                <strong>Включен режим редактирования</strong>
                            </Alert>
                        </Collapse>
                        {/* Меняем цвет рамки полей ввода в зависимости от того активен режим редактирвоания или нет. */}
                        <FormGroup validationState={ this.state.editMode ? 'warning' : 'success'}>
                            <Col componentClass={ControlLabel} sm={2}>
                                Пункт отправления
                            </Col>
                            <Col sm={10}>
                                <FormControl
                                    id="departure"
                                    type="text"
                                    value={this.state.departure}
                                    disabled={!this.state.editMode}
                                    placeholder="Пункт отправления"
                                    onChange={this.handleAddressChange}
                                />
                            </Col>
                            <Col sm={10} smOffset={2}>
                                <Button
                                    bsStyle="warning"
                                    bsSize="xsmall"
                                    disabled={!this.state.editMode}
                                    onClick={this.swapAddresses}>
                                    <Glyphicon glyph="sort"/>
                                </Button>
                            </Col>
                            <Col componentClass={ControlLabel} sm={2}>
                                Пункт назначения
                            </Col>
                            <Col sm={10}>
                                <FormControl
                                    id="destination"
                                    type="text"
                                    value={this.state.destination}
                                    disabled={!this.state.editMode}
                                    placeholder="Пункт назначения"
                                    onChange={this.handleAddressChange}
                                />
                            </Col>
                        </FormGroup>
                    </Form>

                    <div id="menu" className="pull-right">
                        <Button
                            bsStyle="info"
                            bsSize="xsmall"
                            onClick={ ()=> this.setState({editMode: !this.state.editMode})}
                        >
                            {this.state.editMode ? 'Рассчитать маршрут' : 'Редактировать настройки' }
                        </Button>
                    </div>
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

// Выводим созданный класс на страницу пользователю
ReactDOM.render(<CalculateYandexMapRoute />, document.getElementById('content'));