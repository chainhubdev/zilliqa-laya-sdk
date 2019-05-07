const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');
let plugins = [];
plugins.push(new DtsBundlePlugin());

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
    },
    plugins: plugins,
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                cache: true,
                parallel: true,
                uglifyOptions: {
                    compress: false,
                    ecma: 6,
                    mangle: true
                }
            })
        ]
    }
};

function DtsBundlePlugin(){}
DtsBundlePlugin.prototype.apply = function (compiler) {
    compiler.plugin('done', function(){
        const dts = require('dts-bundle');

        dts.bundle({
            name: 'zilliqa-laya-sdk',
            main: './dist/types/index.d.ts',
            out: '../zilliqa-laya-sdk.d.ts',
            removeSource: true,
            outputAsModuleFolder: true // to use npm in-package typings
        });
    });
};
