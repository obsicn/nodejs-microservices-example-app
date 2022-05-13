# nodejs-microservices-example

Example of Node.js microservices setup using Docker, Docker-Compose and OpenTelemetry.

This is inspired from project: https://github.com/ashleydavis/nodejs-microservices-example

Need to build a microservices application? Learn how to do this with [Bootstrapping Microservices](http://bit.ly/2o0aDsP).


## Important files

- bitbucket-pipelines.yml -> Script that builds this system in the cloud on push to a Bitbucket repo.

- docker-compose.yml -> Script that boots the whole system locally for development and testing.
- db-fixture/           -> Docker container configure to load a database fixture into the MongoDB database.
- scripts/              -> Scripts for building and provisioning the system.
    - infrastructure/   -> Terraform scripts to build the cloud infrastructure.
        - docker/       -> Terraform scripts to build a private Docker registry.
        - kubernetes/   -> Terraform scripts to build a Kubernetes cluster to host our Docker containers.
    - build.sh          -> Master build script. Runs all other scripts in this directory in sequence. Can build this system in the cloud from scratch.
- service/              -> An example microservice.
- web/                  -> Example microservice with a front-end.


## Starting the microservices application

Follow the steps in this section to book the microservices application for developent using Docker.

Change directory to the microservices application:

```bash
cd nodejs-microservices-example
```

Use Docker Compose to start the microservices application:

```bash
docker compose up
```

To build after you change code:

```bash
docker compose up --build
```

A web page is now available:

    http://127.0.0.1:4000

An example REST API is also available:

    http://127.0.0.1:4001/api/data

The Mongodb database is available:

    mongodb://127.0.0.1:4002

In the dev environment updates to the code on the host OS automatically flow through to the microservices in the Docker containers which are rebooted automatically using nodemon. This means you can edit code without having to restart Docker Compose.


#### Run scripts to build, provision and deploy

Before running each script, please ensure it is flagged as executable, eg:

```bash
chmod +x ./scripts/build-image.sh
```

The first time you do a build you need a Docker registry to push images to, run the follow script to provision your private Docker registry:

```bash
./scripts/provision-docker-registry.sh
```

Please take note of the username and password that are printed out after the Docker registry is created. You'll need to set these as environment variables as described in the previous section to be able to push your images to the registry.

Build the Docker image:

```bash
./scripts/build-image.sh service
./scripts/build-image.sh web
```

Push the Docker image to your container registry:

```bash
./scripts/push-image.sh service
./scripts/push-image.sh web
```

Now provision your Kubernetes cluster:

```bash
./scripts/provision-kubernetes.sh
```

You can also run all the build scripts in go using:

```bash
./scripts/build.sh
```

You can also use the build from docker-compose
```bash
docker-compose up --build
```


### Integration with Bitbucket Pipelines

This repo integrates with Bitbucket Pipelines for continuous integration / delivery.

If you put this repo in Bitbucket it will run the script in the file bitbucket-pipelines.yml on each push to the repository. This builds the Docker containers, copies the images to your private Docker Registry, provisions the environment on Azure and deploys the code.

Please make sure you have created a private Docker registry already as mentioned in the previous section.

Please see the earlier section that lists [the environment variables you must set in Bitbucket](https://confluence.atlassian.com/bitbucket/variables-in-pipelines-794502608.html)

Although please don't set the VERSION environment variable for Bitbucket, that's already set to the build number from Bitbucket Pipelines.

## Resources

Setting up Terraform for Azure
https://docs.microsoft.com/en-us/azure/virtual-machines/linux/terraform-install-configure

Creating a service principle:
https://www.terraform.io/docs/providers/azurerm/authenticating_via_service_principal.html

https://docs.microsoft.com/en-us/azure/terraform/terraform-create-k8s-cluster-with-tf-and-aks
https://www.terraform.io/docs/providers/azurerm/r/kubernetes_cluster.html

Great video from Scott Hanselman
https://www.youtube.com/watch?v=iECZMWIQfgc
