import {getRepository} from "typeorm";
import {NextFunction, Request, Response} from "express";
import {User} from "../entity/User";
import {publishToRabbitmq} from "../messagePublisher/send";
import {solrClient} from "../solrclient";

export class UserController {

    private userRepository = getRepository(User);

    async all(request: Request, response: Response, next: NextFunction) {
        return this.userRepository.find();
    }

    async one(request: Request, response: Response, next: NextFunction) {
        return this.userRepository.findOne(request.params.id);
    }

    async save(request: Request, response: Response, next: NextFunction) {
        let newUser = this.userRepository.save(request.body);
        newUser.then(
            user => {
                let userId = user.id;
                console.log("New user with id %d has been stored to mysql", userId);
                console.log("Publishing userId to rabbitmq");
                let data = {
                    action: "add",
                    userId: String(userId)
                };
                publishToRabbitmq(data);
            }
        );
        return newUser;
    }

    async remove(request: Request, response: Response, next: NextFunction) {
        let userToRemove = await this.userRepository.findOne(request.params.id);
        let userId = userToRemove.id;
        try {
            const user = await this.userRepository.remove(userToRemove);
            let username = user.firstName + " " + user.lastName;
            console.log("User with username %s has been removed from mysql", username);
            console.log("Publishing userId to rabbitmq");
            let data = {
                action: "remove",
                userId: String(userId)
            };
            publishToRabbitmq(data);
            return userToRemove;
        } catch (error) {
            console.error(error);
        }
    }

    async search(request: Request, response: Response, next: NextFunction) {
        let searchUsername = request.query.username;
        var objQuery = solrClient.query().q({
            "firstname_ngram": searchUsername
        });
        console.log("Searching for username %s", searchUsername);
        try {
            const result = await solrClient.search(objQuery);
            console.log('Response:', result.response);
            return result;
        } catch (error) {
            console.error(error);
        }
    }
}
