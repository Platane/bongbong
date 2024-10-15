# minimal webRTC demo

# Implementation

## Signaling server

For signaling server, it uses a http server that allows to retrieve and append messages to a list.

It polls the GET endpoint to emulate listen to new messages.

## Flow

**offer / answer**

- The host create an offer, and broadcast it to the guest via the signaling server
- The guest accept the offer and create an answer then broadcast it to the host via the signaling server

**ice candidate**

In the meantime, host and guest exchange ice candidate

The peerConnection instance find suitable ice candidate at init, and potentially after.

When an ice candidate is found, it is broadcasted via the signaling server to the other peer who should add it.

Adding an ice candidate can only be done once the remote offer/answer is set. (So in our implementation we replay the messages once the remote offer/answer is set to add ice candidate )
