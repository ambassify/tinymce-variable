# TinyMCE variable

TinyMCE variable is a plugin that makes it easier to work with variables in text.

## Why

I see a lot of companies that have the need for variables in their editors. Maybe one of the most popular is [MailChimp](http://mailchimp.com/) ([merge tags](http://mailchimp.com/features/merge-tags/)), but non of these companies seems to solve this problem in a very usable way. Especially for non technical people I can imagine that seeing something like `*|FNAME|*` scares the sh*t out of them. So let's try to create a solution for this use case in the form of a plugin.

## Demo

[Demo example of this plugin](http://sitebase.github.io/tinymce-variable/)

## Features

* Replace variables like `{example}` with something more visual
* Variables are not editable
* Delete variables with one hit on the backspace button

## Usage

First include the plugin file in your source:

    <script src="tinymce-variable/src/main.js"></script>

Next add the `variables` plugin to your TinyMCE settings:

    ...
    plugins: "variables",
    ...

## Map variable names

You can also automatically map variable names to something more readable or localized for the user.
An example configuration could be:

    variable_mappers: {
        account_id: 'Account ID'
    }

## Variable validation

In some cases it could be useful to only allow a specific set of variables. This can be done with following configuration:

    variable_valid: ['username', 'sender', 'phone', 'community_name', 'email']

If the variable is not in the array it will not be converted to a visual array on the editor.

## Develop

Start a server to and open it in your browser:

    python -m SimpleHTTPServer
