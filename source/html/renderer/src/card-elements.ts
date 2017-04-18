﻿import * as Enums from "./enums";
import * as Utils from "./utils";
import * as HostConfig from "./host-options";
import * as TextFormatters from "./text-formatter";

function invokeSetParent(obj: any, parent: CardElement) {
    // This is not super pretty, but it the closest emulation of
    // "internal" in TypeScript.
    obj["setParent"](parent);
}

export interface IValidationError {
    error: Enums.ValidationError,
    message: string;
}

export abstract class CardElement {
    private _parent: CardElement = null;

    private internalGetNonZeroPadding(element: CardElement, padding: HostConfig.ISpacingDefinition) {
        if (padding.top == 0) {
            padding.top = element.padding.top;
        }

        if (padding.right == 0) {
            padding.right = element.padding.right;
        }

        if (padding.bottom == 0) {
            padding.bottom = element.padding.bottom;
        }

        if (padding.left == 0) {
            padding.left = element.padding.left;
        }

        if (element.parent) {
            this.internalGetNonZeroPadding(element.parent, padding);
        }
    }

    protected showBottomSpacer() {
        if (this.parent) {
            this.parent.showBottomSpacer();
        }
    }

    protected hideBottomSpacer() {
        if (this.parent) {
            this.parent.hideBottomSpacer();
        }
    }

    protected setParent(value: CardElement) {
        this._parent = value;
    }

    protected get hideOverflow(): boolean {
        return true;
    }

    protected get useDefaultSizing(): boolean {
        return true;
    }

    protected adjustAlignment(element: HTMLElement) {
        switch (this.horizontalAlignment) {
            case Enums.HorizontalAlignment.Center:
                element.style.textAlign = "center";
                break;
            case Enums.HorizontalAlignment.Right:
                element.style.textAlign = "right";
                break;
        }
    }

    protected adjustLayout(element: HTMLElement) {
        element.style.boxSizing = "border-box";

        if (this.useDefaultSizing) {
            element.style.width = "100%";
        }

        this.adjustAlignment(element);

        if (this.hideOverflow) {
            element.style.overflow = "hidden";
        }
    }

    protected isLastElementInParentContainer(): boolean {
        if (this.parent instanceof Container) {
            return (<Container>this.parent).isLastItem(this);
        }
        else {
            return false;
        }
    }

    protected abstract internalRender(): HTMLElement;

    speak: string;
    horizontalAlignment: Enums.HorizontalAlignment = Enums.HorizontalAlignment.Left;
    separation: Enums.Separation;

    abstract getDefaultSeparationDefinition(): HostConfig.ISeparationDefinition;
    abstract renderSpeech(): string;

    getNonZeroPadding(): HostConfig.ISpacingDefinition {
        var padding: HostConfig.ISpacingDefinition = { top: 0, right: 0, bottom: 0, left: 0 };

        this.internalGetNonZeroPadding(this, padding);

        return padding;
    }

    getForbiddenElementTypes(): Array<any> {
        return null;
    }

    getForbiddenActionTypes(): Array<any> {
        return null;
    }

    parse(json: any) {
        this.speak = json["speak"];
        this.horizontalAlignment = Enums.stringToHorizontalAlignment(json["horizontalAlignment"], Enums.HorizontalAlignment.Left);
        this.separation = Enums.stringToSeparation(json["separation"], Enums.Separation.Default);        
    }

    validate(): Array<IValidationError> {
        return [];
    }

    render(): HTMLElement {
        let renderedElement = this.internalRender();

        if (renderedElement != null) {
            this.adjustLayout(renderedElement);
        }

        return renderedElement;
    }

    getRootElement(): CardElement {
        var rootElement: CardElement = this;

        while (rootElement.parent) {
            rootElement = rootElement.parent;
        }

        return rootElement;
    }

    getAllInputs(): Array<Input> {
        return [];
    }

    protected get padding(): HostConfig.ISpacingDefinition {
        return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    get isInteractive(): boolean {
        return false;
    }

    get parent(): CardElement {
        return this._parent;
    }
}

export class TextBlock extends CardElement {
    size: Enums.TextSize = Enums.TextSize.Normal;
    weight: Enums.TextWeight = Enums.TextWeight.Normal;
    color?: Enums.TextColor;
    text: string;
    isSubtle: boolean = false;
    wrap: boolean = true;
    maxLines: number;

    protected internalRender(): HTMLElement {
        if (!Utils.isNullOrEmpty(this.text)) {
            var element = document.createElement("div");
            element.style.fontFamily = AdaptiveCard.configuration.fontFamily;

            var cssStyle = "text ";
            var fontSize: number;

            switch (this.size) {
                case Enums.TextSize.Small:
                    fontSize = AdaptiveCard.configuration.fontSizes.small;
                    break;
                case Enums.TextSize.Medium:
                    fontSize = AdaptiveCard.configuration.fontSizes.medium;
                    break;
                case Enums.TextSize.Large:
                    fontSize = AdaptiveCard.configuration.fontSizes.large;
                    break;
                case Enums.TextSize.ExtraLarge:
                    fontSize = AdaptiveCard.configuration.fontSizes.extraLarge;
                    break;
                default:
                    fontSize = AdaptiveCard.configuration.fontSizes.normal;
                    break;
            }

            element.style.fontSize = fontSize + "px";

            var actualTextColor = this.color ? this.color : AdaptiveCard.renderOptions.defaultTextColor;
            var colorDefinition: HostConfig.IColorDefinition;

            switch (actualTextColor) {
                case Enums.TextColor.Dark:
                    colorDefinition = AdaptiveCard.configuration.colors.dark;
                    break;
                case Enums.TextColor.Light:
                    colorDefinition = AdaptiveCard.configuration.colors.light;
                    break;
                case Enums.TextColor.Accent:
                    colorDefinition = AdaptiveCard.configuration.colors.accent;
                    break;
                case Enums.TextColor.Good:
                    colorDefinition = AdaptiveCard.configuration.colors.good;
                    break;
                case Enums.TextColor.Warning:
                    colorDefinition = AdaptiveCard.configuration.colors.warning;
                    break;
                case Enums.TextColor.Attention:
                    colorDefinition = AdaptiveCard.configuration.colors.attention;
                    break;
                default:
                    colorDefinition = AdaptiveCard.configuration.colors.dark;
                    break;
            }

            element.style.color = this.isSubtle ? colorDefinition.subtle : colorDefinition.normal;

            var fontWeight: number;

            switch (this.weight) {
                case Enums.TextWeight.Lighter:
                    fontWeight = AdaptiveCard.configuration.fontWeights.lighter;
                    break;
                case Enums.TextWeight.Bolder:
                    fontWeight = AdaptiveCard.configuration.fontWeights.bolder;
                    break;
                default:
                    fontWeight = AdaptiveCard.configuration.fontWeights.normal;
                    break;
            }

            element.style.fontWeight = fontWeight.toString();

            var formattedText = TextFormatters.formatText(this.text);

            element.innerHTML = Utils.processMarkdown(formattedText);

            if (element.firstElementChild instanceof (HTMLElement)) {
                (<HTMLElement>element.firstElementChild).style.marginTop = "0px";
            }

            if (element.lastElementChild instanceof (HTMLElement)) {
                (<HTMLElement>element.lastElementChild).style.marginBottom = "0px";
            }

            var anchors = element.getElementsByTagName("a");

            for (var i = 0; i < anchors.length; i++) {
                anchors[i].target = "_blank";
            }

            if (!this.wrap) {
                element.style.whiteSpace = "nowrap";
                element.style.textOverflow = "ellipsis";
            }

            return element;
        }
        else {
            return null;
        }
    }

    getDefaultSeparationDefinition(): HostConfig.ISeparationDefinition {
        switch (this.size) {
            case Enums.TextSize.Small:
                return AdaptiveCard.configuration.textBlock.separation.small;
            case Enums.TextSize.Medium:
                return AdaptiveCard.configuration.textBlock.separation.medium;
            case Enums.TextSize.Large:
                return AdaptiveCard.configuration.textBlock.separation.large;
            case Enums.TextSize.ExtraLarge:
                return AdaptiveCard.configuration.textBlock.separation.extraLarge;
            default:
                return AdaptiveCard.configuration.textBlock.separation.normal;
        }
    }

    parse(json: any) {
        super.parse(json);

        this.text = json["text"];
        this.size = Enums.stringToTextSize(json["size"], Enums.TextSize.Normal);
        this.weight = Enums.stringToTextWeight(json["weight"], Enums.TextWeight.Normal);
        this.color = Enums.stringToTextColor(json["color"], null);
        this.isSubtle = json["isSubtle"];
        this.wrap = json["wrap"];
        this.maxLines = json["maxLines"];        
    }

    renderSpeech(): string {
        if (this.speak != null)
            return this.speak + '\n';

        if (this.text)
            return '<s>' + this.text + '</s>\n';

        return null;
    }
}

class InternalTextBlock extends TextBlock {
    get useDefaultSizing(): boolean {
        return false;
    }
}

export class Fact {
    name: string;
    value: string;
    speak: string;

    renderSpeech(): string {
        if (this.speak != null) {
            return this.speak + '\n';
        }

        return '<s>' + this.name + ' ' + this.value + '</s>\n';
    }
}

export class FactSet extends CardElement {
    protected get useDefaultSizing(): boolean {
        return false;
    }

    protected internalRender(): HTMLElement {
        let element: HTMLElement = null;

        if (this.facts.length > 0) {
            element = document.createElement("table");
            element.style.borderWidth = "0px";
            element.style.borderSpacing = "0px";
            element.style.borderStyle = "none";
            element.style.borderCollapse = "collapse";

            for (var i = 0; i < this.facts.length; i++) {
                var trElement = document.createElement("tr");

                if (i > 0) {
                    trElement.style.marginTop = AdaptiveCard.configuration.factSet.spacing + "px";
                }

                var tdElement = document.createElement("td");
                tdElement.className = "factNameContainer";

                let textBlock = new InternalTextBlock();
                textBlock.text = this.facts[i].name;
                textBlock.size = AdaptiveCard.configuration.factSet.title.size;
                textBlock.color = AdaptiveCard.configuration.factSet.title.color;
                textBlock.isSubtle = AdaptiveCard.configuration.factSet.title.isSubtle;
                textBlock.weight = AdaptiveCard.configuration.factSet.title.weight;
                textBlock.separation = Enums.Separation.None;

                Utils.appendChild(tdElement, textBlock.render());
                Utils.appendChild(trElement, tdElement);

                tdElement = document.createElement("td");
                tdElement.className = "factValueContainer";

                textBlock = new InternalTextBlock();
                textBlock.text = this.facts[i].value;
                textBlock.size = AdaptiveCard.configuration.factSet.value.size;
                textBlock.color = AdaptiveCard.configuration.factSet.value.color;
                textBlock.isSubtle = AdaptiveCard.configuration.factSet.value.isSubtle;
                textBlock.weight = AdaptiveCard.configuration.factSet.value.weight;
                textBlock.separation = Enums.Separation.None;

                Utils.appendChild(tdElement, textBlock.render());
                Utils.appendChild(trElement, tdElement);
                Utils.appendChild(element, trElement);
            }
        }

        return element;
    }

    facts: Array<Fact> = [];

    getDefaultSeparationDefinition(): HostConfig.ISeparationDefinition {
        return AdaptiveCard.configuration.factSet.separation;
    }

    parse(json: any) {
        super.parse(json);
        
        if (json["facts"] != null) {
            var jsonFacts = json["facts"] as Array<any>;

            for (var i = 0; i < jsonFacts.length; i++) {
                let fact = new Fact();

                fact.name = jsonFacts[i]["title"];
                fact.value = jsonFacts[i]["value"];
                fact.speak = jsonFacts[i]["speak"];

                this.facts.push(fact);
            }
        }
    }

    renderSpeech(): string {
        if (this.speak != null) {
            return this.speak + '\n';
        }

        // render each fact 
        let speak = null;

        if (this.facts.length > 0) {
            speak = '';

            for (var i = 0; i < this.facts.length; i++) {
                let speech = this.facts[i].renderSpeech();

                if (speech) {
                    speak += speech;
                }
            }
        }

        return '<p>' + speak + '\n</p>\n';
    }
}

export class Image extends CardElement {
    protected get useDefaultSizing() {
        return false;
    }

    protected adjustAlignment(element: HTMLElement) {
        switch (this.horizontalAlignment) {
            case Enums.HorizontalAlignment.Center:
                element.style.marginLeft = "auto";
                element.style.marginRight = "auto";

                break;
            case Enums.HorizontalAlignment.Right:
                element.style.marginLeft = "auto";

                break;
        }
    }

    protected internalRender(): HTMLElement {
        let imageElement: HTMLImageElement = null;

        if (!Utils.isNullOrEmpty(this.url)) {
            imageElement = document.createElement("img");
            imageElement.style.display = "block";
            imageElement.onclick = (e) => {
                if (this.selectAction != null) {
                    raiseExecuteActionEvent(this.selectAction);
                    e.cancelBubble = true;
                }
            }
            imageElement.classList.add("image");

            if (this.selectAction != null) {
                imageElement.classList.add("selectable");
            }

            switch (this.size) {
                case Enums.Size.Auto:
                    imageElement.style.maxWidth = "100%";
                    break;
                case Enums.Size.Stretch:
                    imageElement.style.width = "100%";
                    break;
                case Enums.Size.Small:
                    imageElement.style.maxWidth = AdaptiveCard.configuration.imageSizes.small + "px";
                    break;
                case Enums.Size.Large:
                    imageElement.style.maxWidth = AdaptiveCard.configuration.imageSizes.large + "px";
                    break;
                default:
                    imageElement.style.maxWidth = AdaptiveCard.configuration.imageSizes.medium + "px";
                    break;
            }

            if (this.style == Enums.ImageStyle.Person) {
                imageElement.classList.add("person");
            }

            imageElement.src = this.url;
        }

        return imageElement;
    }

    style: Enums.ImageStyle = Enums.ImageStyle.Normal;
    url: string;
    size: Enums.Size = Enums.Size.Medium;
    selectAction: ExternalAction;

    getDefaultSeparationDefinition(): HostConfig.ISeparationDefinition {
        return AdaptiveCard.configuration.image.separation;
    }

    parse(json: any) {
        super.parse(json);

        this.url = json["url"];
        this.style = Enums.stringToImageStyle(json["style"], Enums.ImageStyle.Normal);
        this.size = Enums.stringToSize(json["size"], Enums.Size.Medium);

        var selectActionJson = json["selectAction"];

        if (selectActionJson != undefined) {
            this.selectAction = <ExternalAction>Action.createAction(selectActionJson);
            invokeSetParent(this.selectAction, this);
        }        
    }

    renderSpeech(): string {
        if (this.speak != null) {
            return this.speak + '\n';
        }

        return null;
    }
}

export class ImageSet extends CardElement {
    private _images: Array<Image> = [];

    protected internalRender(): HTMLElement {
        let element: HTMLElement = null;

        if (this._images.length > 0) {
            element = document.createElement("div");

            for (var i = 0; i < this._images.length; i++) {
                let renderedImage = this._images[i].render();

                // Default display for Image is "block" but that forces them to stack vertically
                // in a div. So we need to override display and set it to "inline-block". The
                // drawback is that it adds a small spacing at the bottom of each image, which
                // simply can't be removed cleanly in a cross-browser compatible way.
                renderedImage.style.display = "inline-block";
                renderedImage.style.margin = "0px";
                renderedImage.style.marginRight = "10px";

                Utils.appendChild(element, renderedImage);
            }
        }

        return element;
    }

    imageSize: Enums.Size = Enums.Size.Medium;

    getDefaultSeparationDefinition(): HostConfig.ISeparationDefinition {
        return AdaptiveCard.configuration.imageSet.separation;
    }

    parse(json: any) {
        super.parse(json);
        
        this.imageSize = Enums.stringToSize(json["imageSize"], Enums.Size.Medium);

        if (json["images"] != null) {
            let jsonImages = json["images"] as Array<any>;

            for (let i = 0; i < jsonImages.length; i++) {
                var image = new Image();

                image.size = this.imageSize;
                image.url = jsonImages[i]["url"];

                this.addImage(image);
            }
        }
    }

    addImage(image: Image) {
        if (!image.parent) {
            this._images.push(image);

            invokeSetParent(image, this);
        }
        else {
            throw new Error("This image already belongs to another ImageSet");
        }
    }

    renderSpeech(): string {
        if (this.speak != null) {
            return this.speak;
        }

        var speak = null;

        if (this._images.length > 0) {
            speak = '';

            for (var i = 0; i < this._images.length; i++) {
                speak += this._images[i].renderSpeech();
            }
        }

        return speak;
    }
}

export abstract class Input extends CardElement implements Utils.IInput {
    id: string;
    title: string;
    defaultValue: string;

    abstract get value(): string;

    getDefaultSeparationDefinition(): HostConfig.ISeparationDefinition {
        return AdaptiveCard.configuration.input.separation;
    }

    validate(): Array<IValidationError> {
        if (!this.id) {
            return [ { error: Enums.ValidationError.PropertyCantBeNull, message: "All inputs must have a unique Id" } ];
        }
        else {
            return [];
        }
    }

    parse(json: any) {
        super.parse(json);

        this.id = json["id"];
        this.defaultValue = json["value"];
    }

    renderSpeech(): string {
        if (this.speak != null) {
            return this.speak;
        }

        if (this.title) {
            return '<s>' + this.title + '</s>\n';
        }

        return null;
    }

    getAllInputs(): Array<Input> {
        return [ this ];
    }

    get isInteractive(): boolean {
        return true;
    }
}

export class TextInput extends Input {
    private _textareaElement: HTMLTextAreaElement;

    protected internalRender(): HTMLElement {
        this._textareaElement = document.createElement("textarea");
        this._textareaElement.className = "input textInput";

        if (this.isMultiline) {
            this._textareaElement.classList.add("multiline");
        }

        if (!Utils.isNullOrEmpty(this.placeholder)) {
            this._textareaElement.placeholder = this.placeholder;
        }

        if (!Utils.isNullOrEmpty(this.defaultValue)) {
            this._textareaElement.textContent = this.defaultValue;
        }

        if (this.maxLength > 0) {
            this._textareaElement.maxLength = this.maxLength;
        }

        return this._textareaElement;
    }

    maxLength: number;
    isMultiline: boolean;
    placeholder: string;

    parse(json: any) {
        super.parse(json);

        this.maxLength = json["maxLength"];
        this.isMultiline = json["isMultiline"];
        this.placeholder = json["placeholder"];
    }

    get value(): string {
        return this._textareaElement ? this._textareaElement.textContent : null;
    }
}

export class ToggleInput extends Input {
    private _checkboxInputElement: HTMLInputElement;

    protected internalRender(): HTMLElement {
        var element = document.createElement("div");
        element.className = "input";

        this._checkboxInputElement = document.createElement("input");
        this._checkboxInputElement.className = "toggleInput";
        this._checkboxInputElement.type = "checkbox";

        if (this.defaultValue == this.valueOn) {
            this._checkboxInputElement.checked = true;
        }

        var label = new InternalTextBlock();
        label.text = this.title;

        var labelElement = label.render();
        labelElement.classList.add("toggleLabel");

        var compoundInput = document.createElement("div");

        Utils.appendChild(element, this._checkboxInputElement);
        Utils.appendChild(element, labelElement);

        return element;
    }

    title: string;
    valueOn: string;
    valueOff: string;

    parse(json: any) {
        super.parse(json);

        this.title = json["title"];
        this.valueOn = json["valueOn"];
        this.valueOff = json["valueOff"];
    }

    get value(): string {
        if (this._checkboxInputElement) {
            return this._checkboxInputElement.checked ? this.valueOn : this.valueOff;
        }
        else {
            return null;
        }
    }
}

export class Choice {
    title: string;
    value: string;
}

export class ChoiceSetInput extends Input {
    private _selectElement: HTMLSelectElement;
    private _toggleInputs: Array<HTMLInputElement>;

    protected internalRender(): HTMLElement {
        if (!this.isMultiSelect) {
            if (this.isCompact) {
                // Render as a combo box
                this._selectElement = document.createElement("select");
                this._selectElement.className = "input multichoiceInput";

                var option = document.createElement("option");
                option.selected = true;
                option.disabled = true;
                option.hidden = true;
                option.text = this.placeholder;

                Utils.appendChild(this._selectElement, option);

                for (var i = 0; i < this.choices.length; i++) {
                    var option = document.createElement("option");
                    option.value = this.choices[i].value;
                    option.text = this.choices[i].title;

                    Utils.appendChild(this._selectElement, option);
                }

                return this._selectElement;
            }
            else {
                // Render as a series of radio buttons
                var element = document.createElement("div");
                element.className = "input";

                this._toggleInputs = [];

                for (var i = 0; i < this.choices.length; i++) {
                    var radioInput = document.createElement("input");
                    radioInput.className = "toggleInput";
                    radioInput.type = "radio";
                    radioInput.name = this.id;
                    radioInput.value = this.choices[i].value;

                    this._toggleInputs.push(radioInput);

                    var label = new InternalTextBlock();
                    label.text = this.choices[i].title;

                    var labelElement = label.render();
                    labelElement.classList.add("toggleLabel");

                    var compoundInput = document.createElement("div");

                    Utils.appendChild(compoundInput, radioInput);
                    Utils.appendChild(compoundInput, labelElement);

                    Utils.appendChild(element, compoundInput);
                }

                return element;
            }
        }
        else {
            // Render as a list of toggle inputs
            var element = document.createElement("div");
            element.className = "input";

            this._toggleInputs = [];

            for (var i = 0; i < this.choices.length; i++) {
                var checkboxInput = document.createElement("input");
                checkboxInput.className = "toggleInput";
                checkboxInput.type = "checkbox";
                checkboxInput.value = this.choices[i].value;

                this._toggleInputs.push(checkboxInput);

                var label = new InternalTextBlock();
                label.text = this.choices[i].title;

                var labelElement = label.render();
                labelElement.classList.add("toggleLabel");

                var compoundInput = document.createElement("div");

                Utils.appendChild(compoundInput, checkboxInput);
                Utils.appendChild(compoundInput, labelElement);

                Utils.appendChild(element, compoundInput);
            }

            return element;
        }
    }

    choices: Array<Choice> = [];
    isCompact: boolean;
    isMultiSelect: boolean;
    placeholder: string;

    validate(): Array<IValidationError> {
        var result: Array<IValidationError> = [];

        if (this.choices.length == 0) {
            result = [ { error: Enums.ValidationError.CollectionCantBeEmpty, message: "An Input.ChoiceSet must have at least one choice defined." } ];
        }

        for (var i = 0; i < this.choices.length; i++) {
            if (!this.choices[i].title || !this.choices[i].value) {
                result = result.concat([ { error: Enums.ValidationError.PropertyCantBeNull, message: "All choices in an Input.ChoiceSet must have their title and value properties set." } ])
                break;
            }
        }

        return result;
    }

    parse(json: any) {
        super.parse(json);

        this.isCompact = !(json["style"] === "expanded");
        this.isMultiSelect = json["isMultiSelect"];
        this.placeholder = json["placeholder"];

        if (json["choices"] != undefined) {
            var choiceArray = json["choices"] as Array<any>;

            for (var i = 0; i < choiceArray.length; i++) {
                var choice = new Choice();

                choice.title = choiceArray[i]["title"];
                choice.value = choiceArray[i]["value"];

                this.choices.push(choice);
            }
        }
    }

    get value(): string {
        if (!this.isMultiSelect) {
            if (this.isCompact) {
                return this._selectElement ? this._selectElement.value : null;
            }
            else {
                if (this._toggleInputs.length == 0) {
                    return null;
                }

                for (var i = 0; i < this._toggleInputs.length; i++) {
                    if (this._toggleInputs[i].checked) {
                        return this._toggleInputs[i].value;
                    }
                }

                return null;
            }
        }
        else {
            if (this._toggleInputs.length == 0) {
                return null;
            }
            
            var result: string = "";

            for (var i = 0; i < this._toggleInputs.length; i++) {
                if (this._toggleInputs[i].checked) {
                    if (result != "") {
                        result += ";";
                    }

                    result += this._toggleInputs[i].value;
                }
            }

            return result == "" ? null : result;
        }
    }
}

export class NumberInput extends Input {
    private _numberInputElement: HTMLInputElement;

    protected internalRender(): HTMLElement {
        this._numberInputElement = document.createElement("input");
        this._numberInputElement.type = "number";
        this._numberInputElement.className = "input number";
        this._numberInputElement.min = this.min;
        this._numberInputElement.max = this.max;

        if (!Utils.isNullOrEmpty(this.defaultValue)) {
            this._numberInputElement.value = this.defaultValue;
        }

        return this._numberInputElement;
    }

    min: string;
    max: string;

    parse(json: any) {
        super.parse(json);

        this.min = json["min"];
        this.max = json["max"];
    }

    get value(): string {
        return this._numberInputElement ? this._numberInputElement.value : null;
    }
}

export class DateInput extends Input {
    private _dateInputElement: HTMLInputElement;

    protected internalRender(): HTMLElement {
        this._dateInputElement = document.createElement("input");
        this._dateInputElement.type = "date";
        this._dateInputElement.className = "input date";

        return this._dateInputElement;
    }

    get value(): string {
        return this._dateInputElement ? this._dateInputElement.value : null;
    }
}

export class TimeInput extends Input {
    private _timeInputElement: HTMLInputElement;

    protected internalRender(): HTMLElement {
        this._timeInputElement = document.createElement("input");
        this._timeInputElement.type = "time";
        this._timeInputElement.className = "input time";

        return this._timeInputElement;
    }

    get value(): string {
        return this._timeInputElement ? this._timeInputElement.value : null;
    }
}

enum ActionButtonStyle {
    Link,
    Push
}

enum ActionButtonState {
    Normal,
    Expanded,
    Subdued
}

class ActionButton {
    private _action: Action;
    private _style: ActionButtonStyle;
    private _element: HTMLElement = null;
    private _state: ActionButtonState = ActionButtonState.Normal;
    private _text: string;

    private click() {
        if (this.onClick != null) {
            this.onClick(this);
        }
    }

    private updateCssStyle() {
        let cssStyle = this._style == ActionButtonStyle.Link ? "linkButton " : "pushButton ";

        switch (this._state) {
            case ActionButtonState.Expanded:
                cssStyle += " expanded";
                break;
            case ActionButtonState.Subdued:
                cssStyle += " subdued";
                break;
        }

        this._element.className = cssStyle;
    }

    constructor(action: Action, style: ActionButtonStyle) {
        this._action = action;
        this._style = style;
        this._element = document.createElement("div");
        this._element.onclick = (e) => { this.click(); };

        this.updateCssStyle();
    }

    onClick: (actionButton: ActionButton) => void = null;

    get action() {
        return this._action;
    }

    get text(): string {
        return this._text;
    }

    set text(value: string) {
        this._text = value;
        this._element.innerText = this._text;
    }

    get element(): HTMLElement {
        return this._element;
    }

    get state(): ActionButtonState {
        return this._state;
    }

    set state(value: ActionButtonState) {
        this._state = value;

        this.updateCssStyle();
    }
}

export abstract class Action {
    static createAction(json: any): Action {
        var actionType = json["type"];

        var result = AdaptiveCard.actionTypeRegistry.createInstance(actionType);

        if (result) {
            result.parse(json);
        }
        else {
            raiseParseError(
                {
                    error: Enums.ValidationError.UnknownActionType,
                    message: "Unknown action type: " + actionType
                });
        }

        return result;
    }

    private _parent: CardElement = null;

    protected setParent(value: CardElement) {
        this._parent = value;
    }

    validate(): Array<IValidationError> {
        return [];
    }

    prepare(inputs: Array<Input>) {
        // Do nothing in base implementation
    };

    parse(json: any) {
        this.title = json["title"];        
    }

    getAllInputs(): Array<Input> {
        return [];
    }

    title: string;

    get parent(): CardElement {
        return this._parent;
    }
}

export abstract class ExternalAction extends Action {
}

export class SubmitAction extends ExternalAction {
    private _isPrepared: boolean = false;
    private _originalData: Object;
    private _processedData: Object;

    prepare(inputs: Array<Input>) {
        if (this._originalData) {
            this._processedData = JSON.parse(JSON.stringify(this._originalData));
        }
        else {
            this._processedData = { };
        }

        for (var i = 0; i < inputs.length; i++) {
            var inputValue = inputs[i].value;

            if (inputValue != null) {
                this._processedData[inputs[i].id] = inputs[i].value;
            }
        }

        this._isPrepared = true;
    }

    parse(json: any) {
        super.parse(json);

        this.data = json["data"];        
    }

    get data(): Object {
        return this._isPrepared ? this._processedData : this._originalData;
    }

    set data(value: Object) {
        this._originalData = value;
        this._isPrepared = false;
    }
}

export class OpenUrlAction extends ExternalAction {
    url: string;

    validate(): Array<IValidationError> {
        if (!this.url) {
            return [ { error: Enums.ValidationError.PropertyCantBeNull, message: "An Action.OpenUrl must have its url property set." }];
        }
        else {
            return [];
        }
    }

    parse(json: any) {
        super.parse(json);

        this.url = json["url"];        
    }
}

export class HttpHeader {
    private _value = new Utils.StringWithSubstitutions();

    name: string;

    prepare(inputs: Array<Input>) {
        this._value.substituteInputValues(inputs);
    }

    get value(): string {
        return this._value.get();
    }

    set value(newValue: string) {
        this._value.set(newValue);
    }
}

export class HttpAction extends ExternalAction {
    private _url = new Utils.StringWithSubstitutions();
    private _body = new Utils.StringWithSubstitutions();
    private _headers: Array<HttpHeader> = [];

    method: string;

    validate(): Array<IValidationError> {
        var result: Array<IValidationError> = [];

        if (!this.url) {
            result = [ { error: Enums.ValidationError.PropertyCantBeNull, message: "An Action.Http must have its url property set." }];
        }

        if (this.headers.length > 0) {
            for (var i = 0; i < this.headers.length; i++) {
                if (!this.headers[i].name || !this.headers[i].value) {
                    result = result.concat([ { error: Enums.ValidationError.PropertyCantBeNull, message: "All headers of an Action.Http must have their name and value properties set."  } ]);
                    break;
                }
            }
        }

        return result;
    }

    prepare(inputs: Array<Input>) {
        this._url.substituteInputValues(inputs);
        this._body.substituteInputValues(inputs);

        for (var i = 0; i < this._headers.length; i++) {
            this._headers[i].prepare(inputs);
        }
    };

    parse(json: any) {
        super.parse(json);

        this.url = json["url"];
        this.method = json["method"];
        this.body = json["body"];

        if (json["headers"] != null) {
            var jsonHeaders = json["headers"] as Array<any>;

            for (var i = 0; i < jsonHeaders.length; i++) {
                let httpHeader = new HttpHeader();

                httpHeader.name = jsonHeaders[i]["name"];
                httpHeader.value = jsonHeaders[i]["value"];

                this.headers.push(httpHeader);
            }
        }        
    }

    get url(): string {
        return this._url.get();
    }

    set url(value: string) {
        this._url.set(value);
    }

    get body(): string {
        return this._body.get();
    }

    set body(value: string) {
        this._body.set(value);
    }

    get headers(): Array<HttpHeader> {
        return this._headers;
    }
}

export class ShowCardAction extends Action {
    protected setParent(value: CardElement) {
        super.setParent(value);

        invokeSetParent(this.card, value);
    }

    readonly card: AdaptiveCard = new InlineAdaptiveCard();

    title: string;

    validate(): Array<IValidationError> {
        return this.card.validate();
    }

    parse(json: any) {
        super.parse(json);

        this.card.parse(json["card"]);
    }

    getAllInputs(): Array<Input> {
        return this.card.getAllInputs();
    }
}

class ActionCollection {
    private _owner: CardElement;
    private _actionButtons: Array<ActionButton> = [];
    private _actionCardContainer: HTMLDivElement;
    private _expandedAction: Action = null;

    private hideActionCardPane() {
        this._actionCardContainer.innerHTML = '';
        this._actionCardContainer.style.padding = "0px";
        this._actionCardContainer.style.marginTop = "0px";

        if (this.onHideActionCardPane) {
            this.onHideActionCardPane();
        }
    }

    private showActionCardPane(action: ShowCardAction) {
        if (this.onShowActionCardPane) {
            this.onShowActionCardPane(action);
        }

        this._actionCardContainer.innerHTML = '';

        var padding = this._owner.getNonZeroPadding();

        this._actionCardContainer.style.paddingLeft = padding.left + "px";
        this._actionCardContainer.style.paddingRight = padding.right + "px";

        this._actionCardContainer.style.marginTop = this.items.length > 1 ? "16px" : "0px";
        this._actionCardContainer.style.marginLeft = "-" + padding.left + "px";
        this._actionCardContainer.style.marginRight = "-" + padding.right + "px";

        Utils.appendChild(this._actionCardContainer, action.card.render());
    }

    private actionClicked(actionButton: ActionButton) {
        if (!(actionButton.action instanceof ShowCardAction)) {
            for (var i = 0; i < this._actionButtons.length; i++) {
                this._actionButtons[i].state = ActionButtonState.Normal;
            }

            this.hideActionCardPane();

            raiseExecuteActionEvent(<ExternalAction>actionButton.action);
        }
        else {
            if (AdaptiveCard.renderOptions.showCardActionMode == Enums.ShowCardActionMode.Popup) {
                var actionShowCard = <ShowCardAction>actionButton.action;

                raiseShowPopupCardEvent(actionShowCard);
            }
            else if (actionButton.action === this._expandedAction) {
                for (var i = 0; i < this._actionButtons.length; i++) {
                    this._actionButtons[i].state = ActionButtonState.Normal;
                }

                this._expandedAction = null;

                this.hideActionCardPane();
            }
            else {
                for (var i = 0; i < this._actionButtons.length; i++) {
                    if (this._actionButtons[i] !== actionButton) {
                        this._actionButtons[i].state = ActionButtonState.Subdued;
                    }
                }

                actionButton.state = ActionButtonState.Expanded;

                this._expandedAction = actionButton.action;

                this.showActionCardPane(actionButton.action);
            }
        }
    }

    items: Array<Action> = [];
    onHideActionCardPane: () => void = null;
    onShowActionCardPane: (action: ShowCardAction) => void = null;

    constructor(owner: CardElement) {
        this._owner = owner;
    }

    validate(): Array<IValidationError> {
        var result: Array<IValidationError> = [];

        if (AdaptiveCard.configuration.maxActions && this.items.length > AdaptiveCard.configuration.maxActions) {
            result.push(
                {
                    error: Enums.ValidationError.TooManyActions,
                    message: "A maximum of " + AdaptiveCard.configuration.maxActions + " actions are allowed."
                });
        }

        if (this.items.length > 0 && !AdaptiveCard.configuration.supportsInteractivity) {
            result.push(
                {
                    error: Enums.ValidationError.InteractivityNotAllowed,
                    message: "Interactivity is not allowed."
                });
        }

        for (var i = 0; i < this.items.length; i++) {
            if (!AdaptiveCard.isActionAllowed(this.items[i], this._owner.getForbiddenActionTypes())) {
                result.push(
                    {
                        error: Enums.ValidationError.ActionTypeNotAllowed,
                        message: "Actions of type " + Utils.getClassNameFromInstance(this.items[i]) + " are not allowe."
                    });
            }

        }

        for (var i = 0; i < this.items.length; i++) {
            result = result.concat(this.items[i].validate());
        }

        return result;
    }

    render(): HTMLElement {
        if (!AdaptiveCard.configuration.supportsInteractivity) {
            return null;
        }

        let element = document.createElement("div");
        // element.className = "actionGroup";

        let buttonStrip = document.createElement("div");
        // buttonStrip.className = "buttonStrip";
        buttonStrip.style.display = "flex";
        buttonStrip.style.overflow = "hidden";

        this._actionCardContainer = document.createElement("div");
        this._actionCardContainer.style.padding = "0px";
        this._actionCardContainer.style.marginTop = "0px";
        this._actionCardContainer.style.backgroundColor = "#EEEEEE";

        var renderedActions: number = 0;

        if (this.items.length == 1 && this.items[0] instanceof ShowCardAction) {
            this.showActionCardPane(<ShowCardAction>this.items[0]);

            renderedActions++;
        }
        else {
            var actionButtonStyle = ActionButtonStyle.Push;

            var maxActions = AdaptiveCard.configuration.maxActions ? Math.min(AdaptiveCard.configuration.maxActions, this.items.length) : this.items.length;

            for (var i = 0; i < maxActions; i++) {
                if (this.items[i] instanceof ShowCardAction) {
                    actionButtonStyle = ActionButtonStyle.Link;
                    break;
                }
            }

            var forbiddenActionTypes = this._owner.getForbiddenActionTypes();

            for (var i = 0; i < maxActions; i++) {
                if (AdaptiveCard.isActionAllowed(this.items[i], forbiddenActionTypes)) {
                    let buttonStripItem = document.createElement("div");
                    // buttonStripItem.className = "buttonStripItem";
                    /*
            flex: 0 1 $item-flex-basis;
            white-space: nowrap;
            overflow: hidden;
                    */
                    buttonStripItem.style.whiteSpace = "nowrap";
                    buttonStripItem.style.overflow = "hidden";
                    buttonStripItem.style.flex = AdaptiveCard.configuration.actionSet.stretch ? "0 1 100%" : "0 1 auto";

                    let actionButton = new ActionButton(this.items[i], actionButtonStyle);
                    actionButton.text = this.items[i].title;

                    actionButton.onClick = (ab) => { this.actionClicked(ab); };

                    this._actionButtons.push(actionButton);

                    Utils.appendChild(buttonStripItem, actionButton.element);

                    /*
                    if (i < this.items.length - 1) {
                        buttonStripItem.classList.add("buttonStripItemSpacer");
                    }
                    */

                    Utils.appendChild(buttonStrip, buttonStripItem);

                    if (i < this.items.length - 1 && AdaptiveCard.configuration.actionSet.buttonSpacing > 0) {
                        var spacer = document.createElement("div");
                        spacer.style.flex = "0 0 " + AdaptiveCard.configuration.actionSet.buttonSpacing + "px";

                        Utils.appendChild(buttonStrip, spacer);
                    }

                    renderedActions++;
                }
            }

            Utils.appendChild(element, buttonStrip);
        }

        Utils.appendChild(element, this._actionCardContainer);

        return renderedActions > 0 ? element : null;
    }

    addAction(action: Action) {
        if (!action.parent) {
            this.items.push(action);

            invokeSetParent(action, this._owner);
        }
        else {
            throw new Error("The action already belongs to another element.")
        }
    }

    getAllInputs(): Array<Input> {
        var result: Array<Input> = [];

        for (var i = 0; i < this.items.length; i++) {
            var action = this.items[i];

            result = result.concat(action.getAllInputs());
        }

        return result;
    }
}

export class ActionSet extends CardElement {
    private _actionCollection: ActionCollection;

    protected get hideOverflow(): boolean {
        return false;
    }

    protected internalRender(): HTMLElement {
        return this._actionCollection.render();
    }
    
    constructor() {
        super();

        this._actionCollection = new ActionCollection(this);
        this._actionCollection.onHideActionCardPane = () => {
            if (this.isLastElementInParentContainer()) {
                this.showBottomSpacer();
            }
        };
        this._actionCollection.onShowActionCardPane = (action: ShowCardAction) => {
            if (this.isLastElementInParentContainer()) {
                this.hideBottomSpacer();
            }
        };
    }

    getDefaultSeparationDefinition(): HostConfig.ISeparationDefinition {
        return AdaptiveCard.configuration.actionSet.separation;
    }

    validate(): Array<IValidationError> {
        return this._actionCollection.validate();
    }

    parse(json: any, itemsCollectionPropertyName: string = "items") {
        super.parse(json);

        if (json["actions"] != undefined) {
            var jsonActions = json["actions"] as Array<any>;

            for (var i = 0; i < jsonActions.length; i++) {
                this.addAction(Action.createAction(jsonActions[i]));
            }
        }
    }

    addAction(action: Action) {
        if (action != null) {
            this._actionCollection.addAction(action);
        }
    }

    getAllInputs(): Array<Input> {
        return this._actionCollection.getAllInputs();
    }

    renderSpeech(): string {
        // TODO: What's the right thing to do here?
        return "";
    }

    get isInteractive(): boolean {
        return true;
    }
}

export class Container extends CardElement {
    private _items: Array<CardElement> = [];

    protected showBottomSpacer() {
        super.showBottomSpacer();

        this._element.style.paddingBottom = AdaptiveCard.configuration.padding.bottom + "px";
    }

    protected hideBottomSpacer(requestingElement: CardElement = null) {
        super.hideBottomSpacer();

        this._element.style.paddingBottom = "0px";
    }

    protected internalRender(): HTMLElement {
        this._element = document.createElement("div");
        this._element.className = "container";

        if (this.selectAction) {
            this._element.classList.add("selectable");
        }

        this._element.style.paddingTop = this.padding.top + "px";
        this._element.style.paddingRight = this.padding.right + "px";
        this._element.style.paddingBottom = this.padding.bottom + "px";
        this._element.style.paddingLeft = this.padding.left + "px";
        this._element.onclick = (e) => {
            if (this.selectAction != null) {
                raiseExecuteActionEvent(this.selectAction);
                e.cancelBubble = true;
            }
        }

        if (this._items.length > 0) {
            var renderedElementCount: number = 0;

            for (var i = 0; i < this._items.length; i++) {
                var renderedElement = AdaptiveCard.isElementAllowed(this._items[i], this.getForbiddenElementTypes()) ? this._items[i].render() : null;

                if (renderedElement != null) {
                    if (renderedElementCount > 0 && this._items[i].separation != Enums.Separation.None) {
                        var separationDefinition = this._items[i].separation == Enums.Separation.Default ? this._items[i].getDefaultSeparationDefinition() : AdaptiveCard.configuration.strongSeparation;

                        Utils.appendChild(this._element, Utils.renderSeparation(separationDefinition));
                    }

                    Utils.appendChild(this._element, renderedElement);

                    renderedElementCount++;
                }
            }
        }

        return renderedElementCount > 0 ? this._element : null;
    }

    protected _element: HTMLDivElement;

    protected get hideOverflow() {
        return false;
    }

    protected get padding(): HostConfig.ISpacingDefinition {
        return { left: 0, top: 0, right: 0, bottom: 0};
    }

    selectAction: ExternalAction;

    isLastItem(item: CardElement): boolean {
        return this._items.indexOf(item) == (this._items.length - 1);
    }

    getDefaultSeparationDefinition(): HostConfig.ISeparationDefinition {
        return AdaptiveCard.configuration.container.separation;
    }

    validate(): Array<IValidationError> {
        var result: Array<IValidationError> = [];

        for (var i = 0; i < this._items.length; i++) {
            if (!AdaptiveCard.configuration.supportsInteractivity && this._items[i].isInteractive) {
                result.push(
                    {
                        error: Enums.ValidationError.InteractivityNotAllowed,
                        message: "Interactivity is not allowed."
                    });
            }

            if (!AdaptiveCard.isElementAllowed(this._items[i], this.getForbiddenElementTypes())) {
                result.push(
                    {
                        error: Enums.ValidationError.InteractivityNotAllowed,
                        message: "Elements of type " + Utils.getClassNameFromInstance(this._items[i]) + " are not allowed in this container."
                    });
            }

            result = result.concat(this._items[i].validate());
        }

        return result;
    }

    parse(json: any, itemsCollectionPropertyName: string = "items") {
        super.parse(json);

        if (json[itemsCollectionPropertyName] != null) {
            var items = json[itemsCollectionPropertyName] as Array<any>;

            for (var i = 0; i < items.length; i++) {
                var elementType = items[i]["type"];

                var element = AdaptiveCard.elementTypeRegistry.createInstance(elementType);

                if (!element) {
                    raiseParseError(
                        {
                            error: Enums.ValidationError.UnknownElementType,
                            message: "Unknown element type: " + elementType
                        });
                }
                else {
                    this.addItem(element);

                    element.parse(items[i]);
                }
            }
        }

        var selectActionJson = json["selectAction"];

        if (selectActionJson != undefined) {
            this.selectAction = <ExternalAction>Action.createAction(selectActionJson);
            invokeSetParent(this.selectAction, this);
        }
    }

    addItem(item: CardElement) {
        if (!item.parent) {
            this._items.push(item);

            invokeSetParent(item, this);
        }
        else {
            throw new Error("The element already belongs to another container.")
        }
    }

    getAllInputs(): Array<Input> {
        var result: Array<Input> = [];

        for (var i = 0; i < this._items.length; i++) {
            var item: CardElement = this._items[i];

            result = result.concat(item.getAllInputs());
        }

        return result;
    }

    renderSpeech(): string {
        if (this.speak != null) {
            return this.speak;
        }

        // render each item
        let speak = null;

        if (this._items.length > 0) {
            speak = '';

            for (var i = 0; i < this._items.length; i++) {
                var result = this._items[i].renderSpeech();

                if (result) {
                    speak += result;
                }
            }
        }

        return speak;
    }
}

export class Column extends Container {
    protected get padding(): HostConfig.ISpacingDefinition {
        return { left: 0, top: 0, right: 0, bottom: 0};
    }

    protected adjustLayout(element: HTMLElement) {
        if (this.weight > 0) {
            element.style.flex = "1 1 " + this.weight + "%";
        }
        else if (this.weight == 0) {
            element.style.flex = "0 0 auto";
        }
        else {
            element.style.flex = "1 1 auto";
        }
    }

    weight: number = 100;

    getDefaultSeparationDefinition(): HostConfig.ISeparationDefinition {
        return AdaptiveCard.configuration.column.separation;
    }

    parse(json: any) {
        super.parse(json);

        if (json["size"] === "auto") {
            this.weight = 0;
        }
        else if (json["size"] === "stretch") {
            this.weight = -1;
        }
        else {
            this.weight = Number(json["size"]);
        }
    }
}

export class ColumnSet extends CardElement {
    private _columns: Array<Column> = [];

    protected internalRender(): HTMLElement {
        if (this._columns.length > 0) {
            var element = document.createElement("div");
            element.style.display = "flex";

            var renderedColumnCount: number = 0;

            for (let i = 0; i < this._columns.length; i++) {
                var renderedColumn = this._columns[i].render();

                if (renderedColumn != null) {
                    Utils.appendChild(element, renderedColumn);

                    if (this._columns.length > 1 && i < this._columns.length - 1 && this._columns[i + 1].separation != Enums.Separation.None) {
                        var separationDefinition = this._columns[i + 1].separation == Enums.Separation.Default ? this._columns[i + 1].getDefaultSeparationDefinition() : AdaptiveCard.configuration.strongSeparation;

                        if (separationDefinition) {
                            var separator = document.createElement("div");
                            separator.style.flex = "0 0 auto";

                            if (separationDefinition.lineThickness) {
                                separator.style.marginLeft = (separationDefinition.spacing / 2) + "px";
                                separator.style.paddingLeft = (separationDefinition.spacing / 2) + "px";
                                separator.style.borderLeft = separationDefinition.lineThickness + "px solid " + separationDefinition.lineColor;
                            }
                            else {
                                separator.style.width = separationDefinition.spacing + "px";
                            }

                            Utils.appendChild(element, separator);
                        }
                    }

                    renderedColumnCount++;
                }
            }

            return renderedColumnCount > 0 ? element : null;
        }
        else {
            return null;
        }
    }

    getDefaultSeparationDefinition(): HostConfig.ISeparationDefinition {
        return AdaptiveCard.configuration.columnSet.separation;
    }

    parse(json: any) {
        super.parse(json);
        
        if (json["columns"] != null) {
            let jsonColumns = json["columns"] as Array<any>;

            for (let i = 0; i < jsonColumns.length; i++) {
                var column = new Column();

                column.parse(jsonColumns[i]);

                this.addColumn(column);
            }
        }
    }

    addColumn(column: Column) {
        if (!column.parent) {
            this._columns.push(column);

            invokeSetParent(column, this);
        }
        else {
            throw new Error("This column already belongs to another ColumnSet.");
        }
    }

    renderSpeech(): string {
        if (this.speak != null) {
            return this.speak;
        }

        // render each item
        let speak = '';

        if (this._columns.length > 0) {
            for (var i = 0; i < this._columns.length; i++) {
                speak += this._columns[i].renderSpeech();
            }
        }

        return speak;
    }
}

export interface IVersion {
    major: number;
    minor: number;
}

export interface IRenderOptions {
    defaultTextColor: Enums.TextColor;
    showCardActionMode: Enums.ShowCardActionMode;
}

function raiseExecuteActionEvent(action: ExternalAction) {
    if (AdaptiveCard.onExecuteAction != null) {
        action.prepare(action.parent.getRootElement().getAllInputs());

        AdaptiveCard.onExecuteAction(action);
    }
}

function raiseShowPopupCardEvent(action: ShowCardAction) {
    if (AdaptiveCard.onShowPopupCard != null) {
        AdaptiveCard.onShowPopupCard(action);
    }
}

function raiseParseError(error: IValidationError) {
    if (AdaptiveCard.onParseError != null) {
        AdaptiveCard.onParseError(error);
    }
}

interface ITypeRegistration<T> {
    typeName: string,
    createInstance: () => T;
}

export class TypeRegistry<T> {
    private _items: Array<ITypeRegistration<T>> = [];

    private findTypeRegistration(typeName: string): ITypeRegistration<T> {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].typeName === typeName) {
                return this._items[i];
            }
        }

        return null;
    }

    clear() {
        this._items = [];
    }

    registerType(typeName: string, createInstance: () => T) {
        var registrationInfo = this.findTypeRegistration(typeName);

        if (registrationInfo != null) {
            registrationInfo.createInstance = createInstance;
        }
        else {
            registrationInfo = {
                typeName: typeName,
                createInstance: createInstance
            }

            this._items.push(registrationInfo);
        }
    }

    unregisterType(typeName: string) {
        for (var i = 0; i < this._items.length; i++) {
            if (this._items[i].typeName === typeName) {                
                this._items = this._items.splice(i, 1);

                return;
            }
        }
    }

    createInstance(typeName: string): T {
        var registrationInfo = this.findTypeRegistration(typeName);

        return registrationInfo ? registrationInfo.createInstance() : null;
    }
}

export abstract class ContainerWidthActions extends Container {
    private _actionCollection: ActionCollection;

    protected internalRender(): HTMLElement {
        super.internalRender();

        var renderedActions = this._actionCollection.render();

        if (renderedActions) {
            Utils.appendChild(this._element, Utils.renderSeparation(AdaptiveCard.configuration.actionSet.separation));
            Utils.appendChild(this._element, renderedActions);
        }

        return this._element.children.length > 0 ? this._element : null;        
    }

    constructor() {
        super();

        this._actionCollection = new ActionCollection(this);
        this._actionCollection.onHideActionCardPane = () => { this.showBottomSpacer() };
        this._actionCollection.onShowActionCardPane = (action: ShowCardAction) => { this.hideBottomSpacer() };
    }

    parse(json: any, itemsCollectionPropertyName: string = "items") {
        super.parse(json, itemsCollectionPropertyName);

        if (json["actions"] != undefined) {
            var jsonActions = json["actions"] as Array<any>;

            for (var i = 0; i < jsonActions.length; i++) {
                var action = Action.createAction(jsonActions[i]);

                if (action != null) {
                    this.addAction(action);
                }
            }
        }
    }

    addAction(action: Action) {
        this._actionCollection.addAction(action);
    }

    getAllInputs(): Array<Input> {
        return super.getAllInputs().concat(this._actionCollection.getAllInputs());
    }
}

export class AdaptiveCard extends ContainerWidthActions {
    private static currentVersion: IVersion = { major: 1, minor: 0 };

    static elementTypeRegistry = new TypeRegistry<CardElement>();
    static actionTypeRegistry = new TypeRegistry<Action>();

    static onExecuteAction: (action: ExternalAction) => void = null;
    static onShowPopupCard: (action: ShowCardAction) => void = null;
    static onParseError: (error: IValidationError) => void = null;

    static configuration: HostConfig.IAdaptiveCardConfiguration = {
        maxActions: 5,
        supportedActionTypes: [
            HttpAction,
            OpenUrlAction,
            SubmitAction,
            ShowCardAction
        ],
        supportedElementTypes: [
            Container,
            TextBlock,
            Image,
            ImageSet,
            FactSet,
            ColumnSet,
            ActionSet,
            TextInput,
            DateInput,
            NumberInput,
            ChoiceSetInput,
            ToggleInput            
        ],
        supportsInteractivity: true,
        backgroundColor: "transparent",
        strongSeparation: {
            spacing: 40,
            lineThickness: 1,
            lineColor: "#EEEEEE"
        },
        padding: {
            left: 20,
            top: 20,
            right: 20,
            bottom: 20
        },
        fontFamily: "Segoe UI",
        fontSizes: {
            small: 8,
            normal: 10,
            medium: 12,
            large: 14,
            extraLarge: 16
        },
        fontWeights: {
            lighter: 200,
            normal: 400,
            bolder: 600
        },
        colors: {
            dark: {
                normal: "#0000FF",
                subtle: "#222222"
            },
            light: {
                normal: "#FFFFFF",
                subtle: "#DDDDDD"
            },
            accent: {
                normal: "#0000FF",
                subtle: "#0000DD" 
            },
            attention: {
                normal: "#FF6600",
                subtle: "#DD4400"
            },
            good: {
                normal: "#00FF00",
                subtle: "#00DD00"
            },
            warning: {
                normal: "#FF0000",
                subtle: "#DD0000"
            }
        },
        imageSizes: {
            small: 40,
            medium: 80,
            large: 160
        },
        container: {
            separation: {
                spacing: 20
            }
        },
        textBlock: {
            separation: {
                small: {
                    spacing: 20,
                },
                normal: {
                    spacing: 20
                },
                medium: {
                    spacing: 20
                },
                large: {
                    spacing: 20
                },
                extraLarge: {
                    spacing: 20
                }
            }
        },
        image: {
            size: Enums.Size.Medium,
            separation: {
                spacing: 20
            }
        },
        imageSet: {
            imageSize: Enums.Size.Medium,
            separation: {
                spacing: 20
            }
        },
        factSet: {
            separation: {
                spacing: 20
            },
            title: {
                color: Enums.TextColor.Attention,
                size: Enums.TextSize.Large,
                isSubtle: false,
                weight: Enums.TextWeight.Bolder
            },
            value: {
                color: Enums.TextColor.Warning,
                size: Enums.TextSize.ExtraLarge,
                isSubtle: false,
                weight: Enums.TextWeight.Normal
            },
            spacing: 10
        },
        input: {
            separation: {
                spacing: 20
            }
        },
        columnSet: {
            separation: {
                spacing: 20
            }
        },
        column: {
            separation: {
                spacing: 20
            }
        },
        actionSet: {
            separation: {
                spacing: 20
            },
            buttonSpacing: 20,
            stretch: false
        },
    }

    static renderOptions: IRenderOptions = {
        defaultTextColor: Enums.TextColor.Dark,
        showCardActionMode: Enums.ShowCardActionMode.Inline
    }

    static initialize() {
        AdaptiveCard.elementTypeRegistry.clear();

        AdaptiveCard.elementTypeRegistry.registerType("Container", () => { return new Container(); });
        AdaptiveCard.elementTypeRegistry.registerType("TextBlock", () => { return new TextBlock(); });
        AdaptiveCard.elementTypeRegistry.registerType("Image", () => { return new Image(); });
        AdaptiveCard.elementTypeRegistry.registerType("ImageSet", () => { return new ImageSet(); });
        AdaptiveCard.elementTypeRegistry.registerType("FactSet", () => { return new FactSet(); });
        AdaptiveCard.elementTypeRegistry.registerType("ColumnSet", () => { return new ColumnSet(); });
        AdaptiveCard.elementTypeRegistry.registerType("ActionSet", () => { return new ActionSet(); });
        AdaptiveCard.elementTypeRegistry.registerType("Input.Text", () => { return new TextInput(); });
        AdaptiveCard.elementTypeRegistry.registerType("Input.Date", () => { return new DateInput(); });
        AdaptiveCard.elementTypeRegistry.registerType("Input.Time", () => { return new TimeInput(); });
        AdaptiveCard.elementTypeRegistry.registerType("Input.Number", () => { return new NumberInput(); });
        AdaptiveCard.elementTypeRegistry.registerType("Input.ChoiceSet", () => { return new ChoiceSetInput(); });
        AdaptiveCard.elementTypeRegistry.registerType("Input.Toggle", () => { return new ToggleInput(); });

        AdaptiveCard.actionTypeRegistry.clear();

        AdaptiveCard.actionTypeRegistry.registerType("Action.Http", () => { return new HttpAction(); });
        AdaptiveCard.actionTypeRegistry.registerType("Action.OpenUrl", () => { return new OpenUrlAction(); });
        AdaptiveCard.actionTypeRegistry.registerType("Action.Submit", () => { return new SubmitAction(); });
        AdaptiveCard.actionTypeRegistry.registerType("Action.ShowCard", () => { return new ShowCardAction(); });
    }

    static isActionAllowed(action: Action, forbiddenActionTypes: Array<any>): boolean {
        var className = Utils.getClassNameFromInstance(action);

        if (forbiddenActionTypes) {
            for (var i = 0; i < forbiddenActionTypes.length; i++) {
                if (className === Utils.getClassNameFromConstructor(forbiddenActionTypes[i])) {
                    return false;
                }
            }
        }

        for (var i = 0; i < AdaptiveCard.configuration.supportedActionTypes.length; i++) {
            if (className === Utils.getClassNameFromConstructor(AdaptiveCard.configuration.supportedActionTypes[i])) {
                return true;
            }
        }

        return false;
    }

    static isElementAllowed(element: CardElement, forbiddenElementTypes: Array<any>) {
        if (!AdaptiveCard.configuration.supportsInteractivity && element.isInteractive) {
            return false;
        }

        var className = Utils.getClassNameFromInstance(element);

        if (forbiddenElementTypes) {
            for (var i = 0; i < forbiddenElementTypes.length; i++) {
                if (className === Utils.getClassNameFromConstructor(forbiddenElementTypes[i])) {
                    return false;
                }
            }
        }

        for (var i = 0; i < AdaptiveCard.configuration.supportedElementTypes.length; i++) {
            if (className === Utils.getClassNameFromConstructor(AdaptiveCard.configuration.supportedElementTypes[i])) {
                return true;
            }
        }

        return false;
    }

    private isVersionSupported(): boolean {
        var unsupportedVersion: boolean =
            (AdaptiveCard.currentVersion.major < this.minVersion.major) ||
            (AdaptiveCard.currentVersion.major == this.minVersion.major && AdaptiveCard.currentVersion.minor < this.minVersion.minor);

        return !unsupportedVersion;
    }

    private _cardTypeName: string;
    
    protected get padding(): HostConfig.ISpacingDefinition {
        return AdaptiveCard.configuration.padding;
    }

    minVersion: IVersion = { major: 1, minor: 0 };
    fallbackText: string;

    validate(): Array<IValidationError> {
        var result: Array<IValidationError> = [];

        if (this._cardTypeName != "AdaptiveCard") {
            result.push(
                {
                    error: Enums.ValidationError.MissingCardType,
                    message: "Invalid or missing card type. Make sure the card's type property is set to \"AdaptiveCard\"."
                });
        }

        if (!this.isVersionSupported()) {
            result.push(
                {
                    error: Enums.ValidationError.UnsupportedCardVersion,
                    message: "The specified card version is not supported."
                });
        }

        return result.concat(super.validate());
    }

    parse(json: any) {
        this._cardTypeName = json["type"];

        var minVersion = json["minVersion"];
        var regEx = /(\d+).(\d+)/gi;
        var matches = regEx.exec(minVersion);

        if (matches != null && matches.length == 3) {
            this.minVersion.major = parseInt(matches[1]);
            this.minVersion.minor = parseInt(matches[2]);
        }

        this.fallbackText = json["fallbackText"];

        super.parse(json, "body");
    }

    render(): HTMLElement {
        var renderedCard: HTMLElement;

        if (!this.isVersionSupported()) {
            renderedCard = document.createElement("div");
            renderedCard.innerHTML = this.fallbackText ? this.fallbackText : "The specified card version is not supported.";

            return renderedCard;
        }
        else {
            return super.render();
        }
    }
}

// This calls acts as a static constructor (see https://github.com/Microsoft/TypeScript/issues/265)
AdaptiveCard.initialize();

class InlineAdaptiveCard extends AdaptiveCard {
    protected get padding(): HostConfig.ISpacingDefinition {
        return { left: 0, top: 16, right: 0, bottom: 16};
    }

    getForbiddenActionTypes(): Array<any> {
        return [ ShowCardAction ];
    }
}