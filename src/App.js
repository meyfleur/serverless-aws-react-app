import React, { Component } from 'react';
import './App.css';

import { withAuthenticator } from 'aws-amplify-react';

import { API, graphqlOperation, Storage } from 'aws-amplify'
import { listPets as ListPets } from './graphql/queries'
import { createPet as CreatePet } from './graphql/mutations'
import { onCreatePet as OnCreatePet } from './graphql/subscriptions'

class App extends Component {
  state = {
    name: '', description: '', pets: []
  }

  // componentDidMount() { working with lambda
  //   this.getPeople()
  //   this.getData()
  // }

  componentWillMount () {
    Storage.get('example.png')
    .then(data => this.setState({ image: data}))
    .catch(err => console.log('error'))
  }

  async componentDidMount() {
    try {
      const pets = await API.graphql(graphqlOperation(ListPets))
      console.log('pets:', pets)
      this.setState({
        pets: pets.data.listPets.items
      })
    } catch (err) {
      console.log('error fetching pets...', err)
    }

    API.graphql(
      graphqlOperation(OnCreatePet)
    ).subscribe({
        next: (eventData) => {
          console.log('eventData', eventData)
          const pet = eventData.value.data.onCreatePet
          const pets = [
            ...this.state.pets.filter(p => {
              const val1 = p.name + p.description
              const val2 = pet.name + pet.description
              return val1 !== val2
            }),
            pet
          ]
          this.setState({ pets })
        }
    });

  }

  // async componentDidMount() { adding auth
  //   const user = await Auth.currentAuthenticatedUser()
  //   console.log('user info:', user.signInUserSession.idToken.payload)
  //   console.log('username:', user.username)
  // }

  addToStorage = () => {
    Storage.put('javascript/MyReactComponent.js', `
      import React from 'react'
      const App = () => (
        <p>Hello World</p>
      )
      export default App
    `)
      .then (result => {
        console.log('result: ', result)
      })
      .catch(err => console.log('error: ', err));
  }

  onChangeFile(e) {
    const file = e.target.files[0];
    Storage.put('example.png', file, {
        contentType: 'image'
    })
    .then (result => console.log(result))
    .catch(err => console.log(err));
  }

  createPet = async() => {
    const { name, description } = this.state
    if (name === '') return
    let pet = { name }
    if (description !== '') {
      pet = { ...pet, description }
    }
    const updatedPetArray = [...this.state.pets, pet]
    this.setState({ pets: updatedPetArray })
    try {
      await API.graphql(graphqlOperation(CreatePet, { input: pet }))
      console.log('item created!')
    } catch (err) {
      console.log('error creating pet...', err)
    }
  }

  getPeople = async() => {
    try {
      const data = await API.get('amplifyrestapi', '/people')
      console.log('data from new people endpoint:', data)
    } catch (err) {
      console.log('error fetching data..', err)
    }
  }

  getData = async() => {
    try {
      const data = await API.get('amplifyrestapi', '/pets')
      console.log('data from Lambda REST API: ', data)
      this.setState({ pets: data.pets })
    } catch (err) {
      console.log('error fetching data..', err)
    }
  }

  onChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  render() {
    return (
      <div className="App">
        {/* {
          this.state.pets.map((p, i) => ( working with lambda
            <p key={i}>{p}</p>
          ))
        } */}
        <input
          name='name'
          placeholder='name'
          onChange={this.onChange}
          value={this.state.name}
        />
        <input
          name='description'
          placeholder='description'
          onChange={this.onChange}
          value={this.state.description}
        />
        <button onClick={this.createPet}>Create Pet</button>

        {
          this.state.pets.map((pet, index) => (
            <div key={index}>
              <h3>{pet.name}</h3>
              <p>{pet.description}</p>
            </div>
          ))
        }
        
        <img src={this.state.image} alt="test" />
        <input
            type="file" accept='image'
            onChange={(e) => this.onChangeFile(e)}
        />
        <button onClick={this.addToStorage}>Add To Storage</button>

      </div>
    );
  }
}

export default withAuthenticator(App, { includeGreetings: true });
