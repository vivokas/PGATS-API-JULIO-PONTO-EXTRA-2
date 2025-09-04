const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const data = require('../fixture/transferMutation.json');
const baseUrl = 'http://localhost:4000/graphql';

describe('Mutation Transfer - External', function () {
  let token;

  // Resgata o token antes de todos os testes
  before(async () => {
    const respostaLogin = await request(baseUrl)
      .post('')
      .send({
        query: `mutation LoginUser($username: String!, $password: String!) {
                loginUser(username: $username, password: $password) {
                token
            }
          }
        `,
        variables: data.user
      });

    //console.log('Login response:', respostaLogin.body);
    token = respostaLogin.body.data.loginUser.token;
  });


  async function criarTransferencia(transfer, token) {
    const req = request(baseUrl).post('');
    if (token) req.set('Authorization', `Bearer ${token}`);

    return req.send({
      query: `mutation CreateTransfer($from: String!, $to: String!, $value: Float!) {
              createTransfer(from: $from, to: $to, value: $value) {
              from
              to
              value
          }
        }
      `,
      variables: transfer
    });
  }

  it('1 - Transferência com sucesso', async () => { 
    const resposta = await criarTransferencia(data.transfer, token);

    expect(resposta.status).to.equal(200);


    expect(resposta.body.data.createTransfer).to.include({
      from: data.transfer.from,
      to: data.transfer.to,
      value: data.transfer.value
    });
  });

  it('2 - Saldo insuficiente para transferência', async () => {
    const transfer = { ...data.transfer, value: 89541 };
    const resposta = await criarTransferencia(transfer, token);

    expect(resposta.status).to.equal(200);
    expect(resposta.body).to.have.nested.property('errors[0].message', 'Saldo insuficiente');
  });

  it('3 - Sem informar token de autenticação recebe erro', async () => {
    const resposta = await criarTransferencia(data.transfer, null); //sem token

    expect(resposta.status).to.equal(200);
    expect(resposta.body).to.have.nested.property('errors[0].message', 'A Autenticação é obrigatória');
  });
});