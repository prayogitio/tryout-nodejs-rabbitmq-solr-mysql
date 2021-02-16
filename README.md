# Try out NodeJs - TypeOrm - Mysql - Rabbitmq - Solr
The purpose of this repository is to exercise using NodeJs, TypeOrm, Mysql, Rabbitmq and Solr.

## Problem/motivation to solve
Suppose we want to store users information to a database and we also want the users to be searchable. We want to design an application such that lightweight and get the jobs done.
Here are our strategies:
1. We use mysql to store users data (`id`, `firstname`, `lastname`, `age`).
2. To make the users searchable, we decided to use Apache Solr to index our users.
3. Rabbitmq will be used as the message broker to publish `userId` to the queue. The consumer will fetch the `userId` and will make decision (whether to index the user to solr or to remove the user from solr). One of the reason to use a message broker is to separate processes that are time consuming and can be done asynchronously by other services.
4. We have several endpoints, those are to `get all users`, `get user by id`, `remove a user by id` and `search users by username`.
5. We create a Solr schema so that we can decide how well the search works. As for now, we search users by querying the `firstname_ngram` field. 
```
Notes: this is the initial problem. As time goes by, I might want to practice other things and will update this problem/motivation.
```

## Steps to run this project:
### Run `MyProject - Main`
Here is where the endpoints will be accessed by the user.
1. Run `npm i` command
2. Setup database settings inside `ormconfig.json` file
3. Run `npm start` command
You should see something like this:
![image](https://user-images.githubusercontent.com/33726233/108095405-68393000-70b2-11eb-908a-72cf70639a0a.png)

### Run `MyProject - Rabbitmq`
In this application, we have `consumer` of the queue and we also interact with Solr by using `SolrClient` instance.
Execute this command to have rabbitmq on your local machine on port `5672` and rabbitmq dashboard on port `15672`. You can login using username `guest` and password `guest`.
```
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```
After rabbitmq container is up and running, execute `npm install` and `npm start` to activate the `consumer`.

You should see something like this:
![image](https://user-images.githubusercontent.com/33726233/108095494-843cd180-70b2-11eb-9cc4-cd8155a185d0.png)

### Setup `Solr instance`
We will use docker to have a Solr instance in our local machine. Run the following commands:
```
docker run -d -p 8983:8983 --name my_solr solr:8
(This will produce a running solr container. You can access solr dashboard on localhost:8983).

docker exec -u root -ti my_solr mkdir /opt/20210215/
(We make a new directory inside the container. You can name the directory anyway you want. Mine is 20210215).

sudo docker cp "/home/prayogitio/Documents/my_learning/myproject/MyProject - Solr Config/" my_solr:/opt/20210215/
(This command is for copying solr config into the newly created directory from previous step. You have to adjust the directory path to your own working path).

docker exec -it my_solr solr create_core -c users -d /opt/20210215/MyProject\ -\ Solr\ Config/
(This is to create a solr core called users with the config we just copied from the previous step).
```

In solr dashboard, we can select `users` core and get query results like this:
![image](https://user-images.githubusercontent.com/33726233/108095754-c6fea980-70b2-11eb-8fe2-18f839e9ce71.png)

### Endpoints
1. Get all users
![image](https://user-images.githubusercontent.com/33726233/108096258-5dcb6600-70b3-11eb-9d0a-94512d345432.png)
2. Get user by id
![image](https://user-images.githubusercontent.com/33726233/108096368-7b98cb00-70b3-11eb-9ffd-3ce7228e1296.png)
3. Add new user
![image](https://user-images.githubusercontent.com/33726233/108096537-a8e57900-70b3-11eb-8a03-87239e7058b0.png)
Output from `MyProject - Main`:
```
New user with id 19 has been stored to mysql
Publishing userId to rabbitmq
creating rabbitmq client..
 [x] Sent { action: 'add', userId: '19' }
```
Output from `MyProject - Rabbitmq`:
```
 [x] Received {
  fields: [Object],
  properties: [Object],
  content: <Buffer 7b 22 61 63 74 69 6f 6e 22 3a 22 61 64 64 22 2c 22 75 73 65 72 49 64 22 3a 22 31 39 22 7d>
}
 Indexing 19 to solr
 Getting userId 19 from mysql
[2021-02-17T00:03:34.207] [DEBUG] solr-node - [_requestPost] requestFullPath:  http://127.0.0.1:8983/solr/users/update?commit=true
[2021-02-17T00:03:34.208] [DEBUG] solr-node - [_requestPost] data:  {
  add: {
    doc: { userid: 19, firstname: 'Ongester', lastname: 'Rick', age: 17 },
    overwrite: true
  }
}
Response: { status: 0, QTime: 149 }
```
4. Remove a user by id
![image](https://user-images.githubusercontent.com/33726233/108096857-08dc1f80-70b4-11eb-9642-119226aa5f5d.png)
Output from `MyProject - Main`:
```
User with username Ongester Rick has been removed from mysql
Publishing userId to rabbitmq
creating rabbitmq client..
 [x] Sent { action: 'remove', userId: '19' }
```
Output from `MyProject - Rabbitmq`:
```
 [x] Received {
  fields: [Object],
  properties: [Object],
  content: <Buffer 7b 22 61 63 74 69 6f 6e 22 3a 22 72 65 6d 6f 76 65 22 2c 22 75 73 65 72 49 64 22 3a 22 31 39 22 7d>
}
 Removing 19 from solr
[2021-02-17T00:06:34.952] [DEBUG] solr-node - [_requestPost] requestFullPath:  http://127.0.0.1:8983/solr/users/update?commit=true
[2021-02-17T00:06:34.953] [DEBUG] solr-node - [_requestPost] data:  { delete: { query: 'userid:19' } }
Response: { status: 0, QTime: 44 }
```
5. Search by firstname_ngram
![image](https://user-images.githubusercontent.com/33726233/108097242-76884b80-70b4-11eb-885c-80313b277ec9.png)
Output from `MyProject - Main`:
```
[2021-02-17T00:08:40.472] [DEBUG] solr-node - [q] params:  [ 'q=firstname_ngram:atrick' ]
Searching for username atrick
[2021-02-17T00:08:40.472] [DEBUG] solr-node - [toString] params:  [ 'q=firstname_ngram:atrick' ]
[2021-02-17T00:08:40.472] [DEBUG] solr-node - [_requestGet] requestFullPath:  http://127.0.0.1:8983/solr/users/select?q=firstname_ngram:atrick&wt=json
Response: {
  numFound: 2,
  start: 0,
  numFoundExact: true,
  docs: [
    {
      userid: '15',
      firstname: 'Patrick',
      lastname: 'Star',
      _version_: 1691784830287609900
    },
    {
      userid: '16',
      firstname: 'Atrick',
      lastname: 'Son',
      _version_: 1691785080079384600
    }
  ]
}
```

That's all for now. Happy learning ^^