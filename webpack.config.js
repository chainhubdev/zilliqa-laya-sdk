const path = require('path');

module.exports = {
    resolve: {
        extensions: ['.js', '.ts', '.json'],
    },
    devtool: 'source-map',
    mode: 'production',
    entry: {
        'zilliqa-laya-sdk': './src/index.ts',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: path.resolve(__dirname, './tsconfig.json'),
                        },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    }
};
