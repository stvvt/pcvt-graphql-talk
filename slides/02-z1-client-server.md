## Agents

<ul>
<li class="fragment">
    GraphQL Server
    <small>Define GraphQL Schema - set of types and code that resolves data</small>
</li>

<li class="fragment">
    GraphQL Client
    <small>Issues GraphQL queries against server and consumes responses</small>
</li>

<li class="fragment">
    Communication channel - undefined
    <small>
    <p>
        How client hands queries to the server and how server delivers responses is not specified (transport agnostic)
    </p>
        Could be HTTP, WebSocket, TCP, whatever IPC, anything.
    </small>
</li>
</ul>