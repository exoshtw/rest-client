module.exports = {
    parser: 'babel-eslint',
    plugins: [
        "jest",
    ],
    env: {
        node: false,
        "jest/globals": true,
        "es6": true,
        "browser": true,
    },
    extends: [
        "eslint:recommended",
        "google",
    ],
    parserOptions: {
        ecmaVersion: 8,
        sourceType: "module",
        ecmaFeatures: {
            spread: true,
            experimentalObjectRestSpread: true,
        }
    },
    rules: {
        indent: ['error', 4, {
            SwitchCase: 1,
            FunctionExpression: {
                parameters: "first",
            },
        }],
        "padded-blocks": 0,
        "no-constant-condition": 0,
    }
};
