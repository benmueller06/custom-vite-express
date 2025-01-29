# custom-vite-express

A [`vite-express`](https://github.com/szymmis/vite-express) server with custom vite plugins for extra features like partials, variable injection and mapping. Made as part of a university project.

## Getting Started

First, install [Node.js](https://nodejs.org) if you haven't already. It is recommended to first enable **corepack** so that your system uses the proper package manager with the proper version:

```bash
corepack enable && corepack install
```

After you've enabled corepack, run the following command to install all required packages using [`pnpm`](https://pnpm.io):

```bash
pnpm install
```

And that's it! You can now start the server by running `pnpm` dev in your terminal. This will:

1. Start a development server that automatically restarts when a file changes
2. Automatically bind to your localhost at port 3000

To view your development-ready site, head over to [http://localhost:3000](http://localhost:3000) in your browser.

## Features

As mentioned before, this repository features custom [vite plugins](https://vite.dev/plugins/) to add some extra features and enhance the experience of working with plain HTML.

### Variable Injection

You can inject any variable (strings, booleans, numbers etc.) into any part of your HTML file by using the moustache tag syntax:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title }}</title>
  </head>
</html>
```

The example above will place a variable called `title` in the `<title>` element. You can inject this variable in the `src/server/main.ts` file by adding the following to the file:

```ts
app.use(injectVariables('/', {
  title: 'My custom title',
}));
```

The string (`'/'`) indicates the page the variables will be injected into (in this case: `https://localhost:3000/` because no path is specified). The second argument, the object, should have the variable name as the key and the value as the value.

If you now head to the page in your browser, you will see that the title has updated.

#### Dynamic Variable Injection

This injection system also supports injecting variables based on request parameters. Instead of an object, the second parameter can be a function that returns the object:

```ts
app.use(injectVariables('/', (request) => {
  return {
    title: 'My custom title',
  }
}));
```

This allows you to access express' request object and (for example) fetch content from a file or database before setting the variables. The function can also be async.

#### Required Variables

You can mark any variable as "required" by prepending a `!` to the variable name: `{{ !myVariable }}`

This will make the server throw an error if a variable is ever not passed.

#### Variable Types

You can add a type to any variable by appending one of the following:

- `:string`
- `:number`
- `:boolean`

Other types are not supported. If a type is mismatched, the server will throw an error. You can combine this with the required variables feature.

### Automatic Path Resolution

Normally when using vite + express, all paths to files that will be served to the client (located in `src/client/`) will have to be **relative paths**. This repository features a plugin that allows you to use the `@/` syntax, which will automatically resolve to the `src/` directory. For example, in the `index.html` file, normally you would load a CSS file like this:

```html
<!doctype html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="./src/client/style.css">
  </head>
</html>
```

Using the custom syntax, you can reference the file like this:

```html
<!doctype html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="@/client/style.css">
  </head>
</html>
```

**This works from any HTML file in the project**.

### Logic & Mapping Statements

Similar to the variables, it is possible to use both logic and mapping statements in this project. Here's what that looks like:

#### Logic Statements

Logic statements can be used to display certain items in a page based on if a variable is true or false. This is how they're used:

```html
{{ myBooleanVariable && (
  <div>Content in here will be shown when myBooleanVariable is true!</div>
) }}
```

The variable is taken from the injected variables. Read more about them in [the variable injection section](#variable-injection).

#### Mapping Statements

You might find yourself in a situation where you need to send a dynamic page to the user. In those cases, an unspecified amount of similar HTML elements might be needed. The mapping statement allows you to render these duplicate items using a single statement:

```html
{{ myArray = (item) => (
  <div>{{ item }}</div>
) }}
```

To explain:

- `myArray` is an array of either strings, numbers, booleans or objects passed in via [variable injection](#variable-injection)
- `item` is the item(s) name within the array

You can then map the item to any HTML structure you want.

When using objects, you are allowed to also supply a key to access different values in the object:

```ts
app.use(injectVariables('/', (request) => {
  return {
    myArray: [{ name: "Item 1", description: "Lorem Ipsum" }, { name: "Item 2", description: "Lorem Ipsum" }, { name: "Item 3", description: "Lorem Ipsum" }]
  }
}));
```

```html
{{ myArray = (item) => (
  <div>{{ item.name }}</div>
  <div>{{ item.description }}</div>
) }}
```

**You are not allowed to nest objects.** Basically, this would not work: `{{ item.data.someProperty }}`

### Partials

Last but not least, this project allows you to use a custom partials syntax to create reuseable components which can be shared across your entire project and multiple pages. This can be useful when creating (for example) a navbar or similar page elements.

Partials are "declared" by creating them in `src/partials/`. The filename (without the file extension) will be the partial name, so creating a file called `MyPartial.html` will result in a partial called `MyPartial`.

These partials can be used by including them as self-closing HTML elements:

```html
<MyPartial />
```

Don't forget the self-closing tag (`/>`), it is required.

You are allowed to nest partials within partials.

#### Variables in Partials

You can pass variables to these partials like normal HTML attributes:

```html
<MyPartial someVariable="69" />
```

For this to work, the variables have to be defined within the partials using the `{{  }}` syntax. In this case, your partial would contain something like:

```html
<span>{{ someVariable }}</span>
```
