// Need to implement warnings

module.exports = function(babel) {
  var t = babel.types;
  return {
    visitor: {
      VariableDeclaration: function(path, state) {
        var newPaths = path.node.declarations.map(function(declaration, index, declarationsArr) {
            if (t.isIdentifier(declaration.id) && isTransformableFunctionCall(path, declaration)) {
              return importDeclaration(t, [declaration.id], [], declaration.init.arguments[0]);
            } else if (t.isObjectPattern(declaration.id) && isTransformableFunctionCall(path, declaration)) {
              
              var defaultIdentifiers = declaration.id.properties.filter(function(prop) {
                return t.isIdentifier(prop.key) && prop.key.name === 'default';
              }).map(function(prop) {
                return prop.value;
              });


              var generalIdentifiers = declaration.id.properties.filter(function(prop) {
                return t.isIdentifier(prop.key) && prop.key.name !== 'default';
              }).map(function(prop) {
                return prop.value;
              });


              return importDeclaration(t, defaultIdentifiers, generalIdentifiers, declaration.init.arguments[0])
            } else if (isTransformableMemberExpression(path, declaration) && hasDefaultProperty(declaration.init)) {
              return importDeclaration(t, [declaration.id], [], declaration.init.object.arguments[0]);
            } else if (isTransformableMemberExpression(path, declaration) && hasDefaultProperty(declaration.init)) {
              return 
            } else if (declarationsArr.length > 1) {
              return variableDeclaration(t, path.node.kind, declaration);
            } else {
              return path.node;
            }
          })

        path.replaceWithMultiple(newPaths);
      }
    }
  };
};

var importDeclaration = function(babelTypes, defaultIdentifiers, generalIdentifiers, source) {
  var defaultImports = defaultIdentifiers.map(function(iden) {
    return babelTypes.importDefaultSpecifier(iden);
  });

  var generalImports = generalIdentifiers.map(function(iden) {
    return babelTypes.importSpecifier(iden, iden);
  });

  return babelTypes.importDeclaration(
          defaultImports.concat(generalImports),
          source
        );
}

var variableDeclaration = function(babelTypes, kind, declaration) {
  return babelTypes.variableDeclaration(kind, [declaration])
}

var isInitialized = function(declaration) {
  return declaration.init !== null;
}

// Need a better name
var isFunctionCall = function(node) {
  return node.type === 'CallExpression';
}

// Need a better name
var isMemberExpression = function(node) {
  return node.type === 'MemberExpression';
}

var isRequireCall = function(node) {
  return node.callee.name === 'require';
}

var hasOnlyOneArgument = function(node) {
  return node.arguments.length === 1;
}

var hasStringArguments = function(node) {
  return node.arguments.every(function(argument) {
    return argument.type === 'StringLiteral';
  });
}

var isChildOfProgram = function(path) {
  return path.parent.type === 'Program';
}

var isTransformableFunctionCall = function(path, node) {
  return isChildOfProgram(path) 
  && isInitialized(node) 
  && isFunctionCall(node.init) 
  && isRequireCall(node.init) 
  && hasOnlyOneArgument(node.init) 
  && hasStringArguments(node.init);
}

var isTransformableMemberExpression = function(path, node) {
  return isChildOfProgram(path) 
  && isInitialized(node) 
  && isMemberExpression(node.init)
  && isFunctionCall(node.init.object)
  && isRequireCall(node.init.object)
  && hasOnlyOneArgument(node.init.object)
  && hasStringArguments(node.init.object);
}

var hasDefaultProperty = function(node) {
  return node.property.name === 'default';
}
