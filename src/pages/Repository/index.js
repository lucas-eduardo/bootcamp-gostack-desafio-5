import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { Loading, Owner, IssuesList, Filter, Page } from './styles';

import api from '../../services/api';

import Container from '../../components/Container';

class Main extends Component {
  constructor(props) {
    super(props);

    const { match } = this.props;

    this.state = {
      repoName: decodeURIComponent(match.params.repository),
      repository: {},
      issues: [],
      loading: true,
      filters: [
        { state: 'all', label: 'Todas', active: true },
        { state: 'open', label: 'Abertas', active: false },
        { state: 'closed', label: 'Fechadas', active: false },
      ],
      page: 1,
    };
  }

  async componentDidMount() {
    const { filters, repoName } = this.state;

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filters.find(filter => filter.active).state,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  loadIssue = async () => {
    const { filters, repoName, page } = this.state;

    const { data } = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filters.find(filter => filter.active).state,
        per_page: 5,
        page,
      },
    });

    this.setState({
      issues: data,
    });
  };

  handleFilter = async state => {
    const { filters } = this.state;

    filters.map(filter => {
      const obj = filter;
      obj.active = filter.state === state;
      return obj;
    });

    this.setState({ filters });

    this.loadIssue();
  };

  handlePage = async pag => {
    const { page } = this.state;

    await this.setState({
      page: pag === 'back' ? page - 1 : page + 1,
    });

    this.loadIssue();
  };

  render() {
    const { repository, issues, loading, filters, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssuesList>
          <Filter>
            {filters.map(filter => (
              <button
                type="button"
                key={filter.label}
                onClick={() => this.handleFilter(filter.state)}
                className={filter.active ? 'active' : ''}
              >
                {filter.label}
              </button>
            ))}
          </Filter>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {issue.title}
                  </a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssuesList>
        <Page>
          <button
            type="button"
            disabled={page < 2}
            onClick={() => this.handlePage('back')}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button type="button" onClick={() => this.handlePage('next')}>
            Próximo
          </button>
        </Page>
      </Container>
    );
  }
}

Main.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      repository: PropTypes.string,
    }),
  }).isRequired,
};

export default Main;
