alaris
======

Disclaimer from 2015
--------------------
```
Being spent now a couple of years in the industry: this is not a good code. 
It is more of a personal experiment of headless development, without any kind of plan. 
So unless this is exactly what you are looking for, please note: do not use this code. For your own sake.
```


About
-----

This is a very simple and lightweight single user blog engine created in nodejs, using express and mysql.

I wanted to create something really lightweight.

Installation
------------

Once you checked out, pull the dependencies.

```
npm install
```

Then you add the database stub I created, and set your blog properties in the config.json.


Tag system
----------

I use a unique tag system. Since human perception of time is a subjective thing, I decided I create "era's" out of tags. Each era has a start date and an end date. Between them the era shows, where you are in time. 

You can set custom backgrounds for eras. When they're overlapping, always the shorter will be applied.

In the future I would like to develop custom styles for eras. 


