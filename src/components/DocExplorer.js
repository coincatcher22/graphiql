/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';
import {
  GraphQLSchema,
  GraphQLUnionType,
  GraphQLInterfaceType,
  isLeafType
} from 'graphql/type';


/**
 * DocExplorer
 *
 *
 * Props:
 *
 *
 */
export class DocExplorer extends React.Component {
  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
    typeName: PropTypes.string
  }

  constructor() {
    super();

    this.EXPLORER_WIDTH = 350;
    this.state = {
      width: 'initial',
      expanded: false,
      inspectedType: null,
      inspectedCall: null
    };

    this.startPage = '';
    this.content = '';

    this.navStack = [];

    this.backToMainButton = (
      <button className="doc-back-to-main-button"
        style={{ marginLeft: "6px" }}
        onClick={this._onBackToMainBtnClick.bind(this)}
      >
        Main Page
      </button>
    );
  }

  _getTypeLink(type) {
    return type.ofType ? (
      <span>
        [
        <a className="doc-type">{type.ofType.name}</a>
        ]
      </span>
    ) : <a className="doc-type">{type.name}</a>;
  }

  _renderTypeFields(type) {
    var _getTypeLink = this._getTypeLink;
    function renderField(field, from) {
      return (
        <div className="doc-category-item">
          <a className="doc-call-sign"
            data-from-type-name={from.name}
            href="javascript:void(0)"
          >
            {field.name}
          </a>
          <span> : </span>
          {_getTypeLink(field.type)}
        </div>
      );
    }

    var fields = type.getFields();
    var fieldsJSX = [];
    Object.keys(fields).forEach(fieldName => {
      fieldsJSX.push(
        renderField(fields[fieldName], type)
      );
    });

    return (
      {fieldsJSX}
    );
  }

  _renderTypeValues(type) {
    function renderValue(value) {
      return (
        <div className="doc-category-item">
          <span className="doc-value-name">{value.name}</span>
        </div>
      );
    }

    var values = type.getValues();
    var valuesJSX = [];
    for (var value of values) {
      valuesJSX.push(renderValue(value));
    }

    return (
      {valuesJSX}
    );
  }

  _renderTypes(types) {
    function renderType(type) {
      return (
        <div className="doc-type-def">
          <a className="doc-type" href="javascript:void(0)">{type.name}</a>
        </div>
      );
    }

    var typesJSX = [];
    for (var type of types) {
      typesJSX.push(renderType(type));
    }

    return (
      {typesJSX}
    );
  }

  _generateStartPage(schema) {
    var queryType = schema.getQueryType();
    var mutationType = schema.getMutationType();

    var typesJSX = this._renderTypes([queryType, mutationType]);

    return (
      <div className="doc-main-page">
        {typesJSX}
      </div>
    );
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.schema && nextProps.schema !== this.props.schema) {
      this.startPage = this._generateStartPage(nextProps.schema);
    }

    if (nextProps.typeName !== this.props.typeName) {
      var typeName = nextProps.typeName;
      if (typeName.endsWith('!')) {
        typeName = typeName.slice(0, typeName.length - 1);
      }
      if (typeName.startsWith('[') && typeName.endsWith(']')) {
        typeName = typeName.slice(1, typeName.length - 1);
      }

      this.setState({
        width: this.EXPLORER_WIDTH,
        expanded: true,
        inspectedType: this.props.schema.getTypeMap()[typeName]
      });
    }
  }

  _generateTypePage(type) {
    var fieldsDef = '';
    var valuesDef = '';
    var typesDef = '';

    if (type instanceof GraphQLUnionType) {
      typesDef = (
        <div className="doc-call-def">
          <div className="doc-category-title">
            possible types
          </div>
          {this._renderTypes(type.getPossibleTypes())}
        </div>
      );
    }

    if (type instanceof GraphQLInterfaceType) {
      typesDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            implemented by
          </div>
          {this._renderTypes(type.getPossibleTypes())}
        </div>
      );
    }

    if (type.getInterfaces && type.getInterfaces().length > 0) {
      typesDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            interfaces
          </div>
          {this._renderTypes(type.getInterfaces())}
        </div>
      );
    }

    if (type.getFields) {
      fieldsDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            fields
          </div>
          {this._renderTypeFields(type)}
        </div>
      );
    }
    if (type.getValues) {
      valuesDef = (
        <div className="doc-category">
          <div className="doc-category-title">
            values
          </div>
          {this._renderTypeValues(type)}
        </div>
      );
    }

    return (
      <div>
        <div className="doc-type-title">
          {type.name}
        </div>
        <div className="doc-type-description">
          {type.description || 'Self descriptive.'}
        </div>
        {typesDef}
        {fieldsDef}
        {valuesDef}
      </div>
    );
  }

  _generateCallPage(call) {
    var callSignature = '';
    var argsJSX = [];
    var argsDef = '';
    if (call.args && call.args.length > 0) {
      for (var arg of call.args) {
        argsJSX.push(
          <div>
            <div className="doc-arg-title">
              {this._getTypeLink(arg.type)}
              {" "}
              <span className="doc-arg-name">{arg.name}</span>
            </div>
            <div className="doc-arg-description">
              {arg.description}
            </div>
          </div>
        );
      }
      argsDef = (
        <div className="doc-arguments">
          <div className="doc-category-title">
            arguments
          </div>
          {argsJSX}
        </div>
      );
    }

    return (
      <div>
        <div className="doc-type-title">
          {call.name}
          <span> : </span>
          <a className="doc-type" href="javascript:void(0)">{call.type.name}</a>
        </div>
        <div className="doc-type-description">
          {call.description}
        </div>
        {argsDef}
      </div>
    );
  }

  _generateNavBackLink() {
    var name = this.navStack.length > 1 ?
      this.navStack[this.navStack.length - 2].elem.name :
      "Main Page";
    return (
      <div className="doc-nav-back-link">
        <a href="javascript:void(0)"
          onClick={this._onNavBackLinkClick.bind(this)}
        >
          Back To {name}
        </a>
      </div>
    );
  }

  _onToggleBtnClick() {
    this.setState({
      width: this.state.expanded ? 'initial' : this.EXPLORER_WIDTH,
      expanded: !this.state.expanded
    });
  }

  _onNavBackLinkClick(event) {
    var newState = {
      inspectedCall: null,
      inspectedType: null
    };

    this.navStack.pop();
    if (this.navStack.length !== 0) {
      var entry = this.navStack[this.navStack.length - 1];
      switch (entry.id) {
        case 'call':
          newState.inspectedCall = entry.elem;
          break;
        case 'type':
          newState.inspectedType = entry.elem;
          break;
      }
    }

    this.setState(newState);
  }

  _onBackToMainBtnClick() {
    this.navStack = [];
    this.setState({
      inspectedType: null,
      inspectedCall: null
    });
  }

  _onDefClick(event) {
    var target = event.target;
    if (target && target.tagName === 'A') {
      switch (target.className) {
        case 'doc-call-sign':
          var typeName = target.getAttribute('data-from-type-name');
          var fields = this.props.schema.getType(typeName).getFields();
          var callName = target.innerHTML;
          this.setState({
            inspectedType: null,
            inspectedCall: fields[callName]
          });
          this.navStack.push({
            id: 'call',
            elem: fields[callName]
          });
          break;
        case 'doc-type':
          var typeName = target.innerHTML;
          var type = this.props.schema.getType(typeName);
          this.setState({
            inspectedType: type,
            inspectedCall: null
          });
          this.navStack.push({
            id: 'type',
            elem: type
          });
          break;
        default:
          break;
      }
    }
  }

  render() {
    var type = this.state.inspectedType;
    var call = this.state.inspectedCall;
    var navBackLinkJSX = '';
    if (this.state.expanded) {
      if (type) {
        this.content = this._generateTypePage(type);
      } else if (call) {
        this.content = this._generateCallPage(call);
      } else {
        this.content = this.startPage;
      }

      if (this.navStack.length > 0) {
        navBackLinkJSX = this._generateNavBackLink();
      }
    } else {
      this.content = '';
    }

    return (
      <div className="doc-explorer"
        style={{ width: this.state.width }}
      >
        <div className="doc-explorer-title-bar">
          <button
            className="doc-explorer-toggle-button"
            onClick={this._onToggleBtnClick.bind(this)}
          >
            {this.state.expanded ? 'Hide' : 'Docs'}
          </button>
          {(this.state.expanded && (type || call)) && this.backToMainButton}
          <div className="doc-explorer-title"
            style={{ display: this.state.expanded ? 'block' : 'none' }}
          >
            Documentation Explorer
          </div>
        </div>
        <div className="doc-explorer-contents"
          onClick={this._onDefClick.bind(this)}
        >
          {navBackLinkJSX}
          {this.content}
        </div>
      </div>
    );
  }
}
