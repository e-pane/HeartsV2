import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: "development",
  entry: {
    login: "./src/login.js",
    game: "./src/index.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js", // creates login.bundle.js and game.bundle.js
  },
  devtool: "eval-source-map",
  devServer: {
    watchFiles: ["./src/index.html", "./src/login.html"],
    static: [
      {
        directory: path.resolve(__dirname, "public"),
        publicPath: "/", // ← important
      },
    ],
    port: 8080,
    open: "/login.html", // <-- open login.html by default
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "./src/index.html",
      chunks: ["game"],
    }),
    new HtmlWebpackPlugin({
      filename: "login.html",
      template: "./src/login.html",
      chunks: ["login"],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          sources: false,
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(csv|tsv)$/i,
        use: ["csv-loader"],
      },
      {
        test: /\.(woff|woff2|ttf|otf|eot)$/i,
        type: "asset/resource",
      },
    ],
  },
};
