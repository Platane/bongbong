a http server that allows to retrieve and append messages to a list.

# API

- `GET /room/<key>` returns the message list as json
- `PUT /room/<key>` appends the json body to the list

# implementation

uses R2 object, and conditional PUT to ensure transactional append

# todo

I am pretty sure there is a smarter (and faster) way to achieve that with durable object
